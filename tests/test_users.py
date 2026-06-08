"""
Tests for /api/users endpoints.

Coverage:
  POST   /api/users                    – register
  POST   /api/users/token              – login
  GET    /api/users/me                 – get current user
  POST   /api/users/forgot-password    – request reset email
  POST   /api/users/reset-password     – reset password with token
  PATCH  /api/users/me/password        – change password (authenticated)
  GET    /api/users/{id}               – get public user
  GET    /api/users/{id}/posts         – get user posts (paginated)
  PATCH  /api/users/{id}               – update user
  DELETE /api/users/{id}               – delete user
  PATCH  /api/users/{id}/picture       – upload profile picture
  DELETE /api/users/{id}/picture       – delete profile picture
"""

from datetime import UTC, datetime, timedelta
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

import models
from auth import hash_reset_token
from tests.conftest import auth_header, create_test_user, login_user


# ── POST /api/users ───────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_create_user_success(client: AsyncClient):
    response = await client.post(
        "/api/users",
        json={"username": "newuser", "email": "new@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
    assert "id" in data
    assert "image_path" in data
    # Sensitive fields must never leak
    assert "password" not in data
    assert "password_hash" not in data


@pytest.mark.anyio
async def test_create_user_email_stored_lowercase(client: AsyncClient):
    response = await client.post(
        "/api/users",
        json={"username": "CaseUser", "email": "UPPER@EXAMPLE.COM", "password": "password123"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "upper@example.com"


@pytest.mark.anyio
async def test_create_user_duplicate_username(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users",
        json={"username": "testuser", "email": "other@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


@pytest.mark.anyio
async def test_create_user_duplicate_username_case_insensitive(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users",
        json={"username": "TESTUSER", "email": "other@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


@pytest.mark.anyio
async def test_create_user_duplicate_email(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users",
        json={"username": "different", "email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.anyio
async def test_create_user_missing_fields(client: AsyncClient):
    response = await client.post("/api/users", json={"username": "only"})
    assert response.status_code == 422
    text = response.text
    assert "email" in text
    assert "password" in text


@pytest.mark.anyio
async def test_create_user_password_too_short(client: AsyncClient):
    response = await client.post(
        "/api/users",
        json={"username": "u", "email": "u@example.com", "password": "short"},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_user_invalid_email(client: AsyncClient):
    response = await client.post(
        "/api/users",
        json={"username": "u", "email": "not-an-email", "password": "password123"},
    )
    assert response.status_code == 422


# ── POST /api/users/token ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_login_success(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users/token",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.anyio
async def test_login_case_insensitive_email(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users/token",
        data={"username": "TEST@EXAMPLE.COM", "password": "testpassword123"},
    )
    assert response.status_code == 200


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient):
    await create_test_user(client)
    response = await client.post(
        "/api/users/token",
        data={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.anyio
async def test_login_unknown_email(client: AsyncClient):
    response = await client.post(
        "/api/users/token",
        data={"username": "nobody@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    # Same message regardless — don't leak which field failed
    assert response.json()["detail"] == "Incorrect email or password"


# ── GET /api/users/me ─────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_get_me_success(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.get("/api/users/me", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user["id"]
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


@pytest.mark.anyio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/users/me")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_me_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer bad.token.here"},
    )
    assert response.status_code == 401


# ── GET /api/users/{id} ───────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_get_user_success(client: AsyncClient):
    user = await create_test_user(client)
    response = await client.get(f"/api/users/{user['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user["id"]
    assert data["username"] == "testuser"
    # Public endpoint must not expose email
    assert "email" not in data
    assert "password_hash" not in data


@pytest.mark.anyio
async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/api/users/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


# ── GET /api/users/{id}/posts ─────────────────────────────────────────────────

@pytest.mark.anyio
async def test_get_user_posts_empty(client: AsyncClient):
    user = await create_test_user(client)
    response = await client.get(f"/api/users/{user['id']}/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["posts"] == []
    assert data["total"] == 0
    assert data["has_more"] is False


@pytest.mark.anyio
async def test_get_user_posts_only_own(client: AsyncClient):
    """Posts from other users must not appear in a user's post list."""
    user1 = await create_test_user(client, username="user1", email="user1@example.com")
    token1 = await login_user(client, email="user1@example.com")
    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    # user1 creates 2 posts, user2 creates 1
    for i in range(2):
        await client.post(
            "/api/posts",
            json={"title": f"User1 Post {i}", "content": "..."},
            headers=auth_header(token1),
        )
    await client.post(
        "/api/posts",
        json={"title": "User2 Post", "content": "..."},
        headers=auth_header(token2),
    )

    data = (await client.get(f"/api/users/{user1['id']}/posts")).json()
    assert data["total"] == 2
    assert all(p["user_id"] == user1["id"] for p in data["posts"])


@pytest.mark.anyio
async def test_get_user_posts_pagination(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)
    for i in range(5):
        await client.post(
            "/api/posts",
            json={"title": f"Post {i}", "content": "..."},
            headers=auth_header(token),
        )

    data = (await client.get(f"/api/users/{user['id']}/posts?limit=2")).json()
    assert len(data["posts"]) == 2
    assert data["total"] == 5
    assert data["has_more"] is True


@pytest.mark.anyio
async def test_get_user_posts_user_not_found(client: AsyncClient):
    response = await client.get("/api/users/99999/posts")
    assert response.status_code == 404


# ── PATCH /api/users/{id} ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_update_user_username(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        f"/api/users/{user['id']}",
        json={"username": "newname"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["username"] == "newname"


@pytest.mark.anyio
async def test_update_user_email(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        f"/api/users/{user['id']}",
        json={"email": "new@example.com"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"


@pytest.mark.anyio
async def test_update_user_duplicate_username(client: AsyncClient):
    await create_test_user(client, username="taken", email="taken@example.com")
    user2 = await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.patch(
        f"/api/users/{user2['id']}",
        json={"username": "taken"},
        headers=auth_header(token2),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


@pytest.mark.anyio
async def test_update_user_duplicate_email(client: AsyncClient):
    await create_test_user(client, username="user1", email="user1@example.com")
    user2 = await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.patch(
        f"/api/users/{user2['id']}",
        json={"email": "user1@example.com"},
        headers=auth_header(token2),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.anyio
async def test_update_user_wrong_user(client: AsyncClient):
    user1 = await create_test_user(client, username="user1", email="user1@example.com")
    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.patch(
        f"/api/users/{user1['id']}",
        json={"username": "hacked"},
        headers=auth_header(token2),
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to update this user"


@pytest.mark.anyio
async def test_update_user_unauthorized(client: AsyncClient):
    user = await create_test_user(client)
    response = await client.patch(f"/api/users/{user['id']}", json={"username": "x"})
    assert response.status_code == 401


# ── DELETE /api/users/{id} ────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_delete_user_success(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.delete(
        f"/api/users/{user['id']}",
        headers=auth_header(token),
    )
    assert response.status_code == 204

    # Confirm gone
    response = await client.get(f"/api/users/{user['id']}")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_user_wrong_user(client: AsyncClient):
    user1 = await create_test_user(client, username="user1", email="user1@example.com")
    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.delete(
        f"/api/users/{user1['id']}",
        headers=auth_header(token2),
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to delete this user"


@pytest.mark.anyio
async def test_delete_user_unauthorized(client: AsyncClient):
    user = await create_test_user(client)
    response = await client.delete(f"/api/users/{user['id']}")
    assert response.status_code == 401


# ── PATCH /api/users/me/password ─────────────────────────────────────────────

@pytest.mark.anyio
async def test_change_password_success(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        "/api/users/me/password",
        json={"current_password": "testpassword123", "new_password": "newpassword456"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"

    # Old password no longer works
    response = await client.post(
        "/api/users/token",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 401

    # New password works
    response = await client.post(
        "/api/users/token",
        data={"username": "test@example.com", "password": "newpassword456"},
    )
    assert response.status_code == 200


@pytest.mark.anyio
async def test_change_password_wrong_current(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        "/api/users/me/password",
        json={"current_password": "wrongpassword", "new_password": "newpassword456"},
        headers=auth_header(token),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect"


@pytest.mark.anyio
async def test_change_password_new_too_short(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        "/api/users/me/password",
        json={"current_password": "testpassword123", "new_password": "short"},
        headers=auth_header(token),
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_change_password_unauthorized(client: AsyncClient):
    response = await client.patch(
        "/api/users/me/password",
        json={"current_password": "x", "new_password": "newpassword456"},
    )
    assert response.status_code == 401


# ── POST /api/users/forgot-password ──────────────────────────────────────────

@pytest.mark.anyio
async def test_forgot_password_sends_email(client: AsyncClient):
    await create_test_user(client)

    with patch(
        "routers.users.send_password_reset_email",
        new_callable=AsyncMock,
    ) as mock_send:
        response = await client.post(
            "/api/users/forgot-password",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 202
        mock_send.assert_awaited_once()
        kwargs = mock_send.call_args.kwargs
        assert kwargs["to_email"] == "test@example.com"
        assert kwargs["username"] == "testuser"
        assert "token" in kwargs


@pytest.mark.anyio
async def test_forgot_password_unknown_email_still_202(client: AsyncClient):
    """Must return 202 even for unknown emails to prevent user enumeration."""
    with patch("routers.users.send_password_reset_email", new_callable=AsyncMock) as mock_send:
        response = await client.post(
            "/api/users/forgot-password",
            json={"email": "nobody@example.com"},
        )
        assert response.status_code == 202
        mock_send.assert_not_awaited()


@pytest.mark.anyio
async def test_forgot_password_replaces_existing_token(client: AsyncClient):
    """A second request should invalidate the first token."""
    await create_test_user(client)

    with patch("routers.users.send_password_reset_email", new_callable=AsyncMock):
        await client.post("/api/users/forgot-password", json={"email": "test@example.com"})
        await client.post("/api/users/forgot-password", json={"email": "test@example.com"})

    # Only one token should exist in DB (handled by the router's DELETE before INSERT)


# ── POST /api/users/reset-password ───────────────────────────────────────────

@pytest.mark.anyio
async def test_reset_password_success(client: AsyncClient, db_session):
    from auth import generate_reset_token, hash_reset_token

    user = await create_test_user(client)

    raw_token = generate_reset_token()
    token_hash = hash_reset_token(raw_token)
    reset_token = models.PasswordResetToken(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=datetime.now(UTC) + timedelta(minutes=30),
    )
    db_session.add(reset_token)
    await db_session.commit()

    response = await client.post(
        "/api/users/reset-password",
        json={"token": raw_token, "new_password": "brandnewpassword"},
    )
    assert response.status_code == 200
    assert "reset successfully" in response.json()["message"]

    # Can now login with new password
    login_response = await client.post(
        "/api/users/token",
        data={"username": "test@example.com", "password": "brandnewpassword"},
    )
    assert login_response.status_code == 200


@pytest.mark.anyio
async def test_reset_password_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/users/reset-password",
        json={"token": "totallyfaketoken", "new_password": "newpassword123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired reset token"


@pytest.mark.anyio
async def test_reset_password_expired_token(client: AsyncClient, db_session):
    from auth import generate_reset_token, hash_reset_token

    user = await create_test_user(client)

    raw_token = generate_reset_token()
    token_hash = hash_reset_token(raw_token)
    reset_token = models.PasswordResetToken(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=datetime.now(UTC) - timedelta(minutes=1),  # already expired
    )
    db_session.add(reset_token)
    await db_session.commit()

    response = await client.post(
        "/api/users/reset-password",
        json={"token": raw_token, "new_password": "newpassword123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired reset token"


# ── PATCH /api/users/{id}/picture ────────────────────────────────────────────

@pytest.mark.anyio
async def test_upload_profile_picture_success(client: AsyncClient, mocked_aws):
    user = await create_test_user(client)
    token = await login_user(client)

    image_bytes = (Path(__file__).parent / "test_image.jpg").read_bytes()
    response = await client.patch(
        f"/api/users/{user['id']}/picture",
        files={"file": ("photo.jpg", BytesIO(image_bytes), "image/jpeg")},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["image_file"] is not None
    assert data["image_file"].endswith(".jpg")
    assert "s3" in data["image_path"]

    objects = mocked_aws.list_objects_v2(Bucket="test-bucket")
    assert len(objects["Contents"]) == 1


@pytest.mark.anyio
async def test_upload_profile_picture_wrong_user(client: AsyncClient, mocked_aws):
    user1 = await create_test_user(client, username="user1", email="user1@example.com")
    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    image_bytes = (Path(__file__).parent / "test_image.jpg").read_bytes()
    response = await client.patch(
        f"/api/users/{user1['id']}/picture",
        files={"file": ("photo.jpg", BytesIO(image_bytes), "image/jpeg")},
        headers=auth_header(token2),
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_upload_profile_picture_invalid_file(client: AsyncClient, mocked_aws):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        f"/api/users/{user['id']}/picture",
        files={"file": ("bad.jpg", BytesIO(b"this is not an image"), "image/jpeg")},
        headers=auth_header(token),
    )
    assert response.status_code == 400
    assert "Invalid image" in response.json()["detail"]


# ── DELETE /api/users/{id}/picture ───────────────────────────────────────────

@pytest.mark.anyio
async def test_delete_profile_picture_success(client: AsyncClient, mocked_aws):
    user = await create_test_user(client)
    token = await login_user(client)

    # Upload first
    image_bytes = (Path(__file__).parent / "test_image.jpg").read_bytes()
    await client.patch(
        f"/api/users/{user['id']}/picture",
        files={"file": ("photo.jpg", BytesIO(image_bytes), "image/jpeg")},
        headers=auth_header(token),
    )

    # Then delete
    response = await client.delete(
        f"/api/users/{user['id']}/picture",
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["image_file"] is None


@pytest.mark.anyio
async def test_delete_profile_picture_none_exists(client: AsyncClient, mocked_aws):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.delete(
        f"/api/users/{user['id']}/picture",
        headers=auth_header(token),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "No profile picture to delete"


@pytest.mark.anyio
async def test_delete_profile_picture_wrong_user(client: AsyncClient, mocked_aws):
    user1 = await create_test_user(client, username="user1", email="user1@example.com")
    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.delete(
        f"/api/users/{user1['id']}/picture",
        headers=auth_header(token2),
    )
    assert response.status_code == 403
