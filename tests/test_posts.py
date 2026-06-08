"""
Tests for /api/posts endpoints.

Coverage:
  GET    /api/posts                – list with pagination
  GET    /api/posts/{id}           – single post
  POST   /api/posts                – create
  PUT    /api/posts/{id}           – full replace
  PATCH  /api/posts/{id}           – partial update
  DELETE /api/posts/{id}           – delete
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header, create_test_user, login_user


# ── Helpers ───────────────────────────────────────────────────────────────────

async def create_post(
    client: AsyncClient,
    token: str,
    title: str = "Test Post",
    content: str = "Test content.",
) -> dict:
    response = await client.post(
        "/api/posts",
        json={"title": title, "content": content},
        headers=auth_header(token),
    )
    assert response.status_code == 201, response.text
    return response.json()


# ── GET /api/posts ────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_get_posts_empty(client: AsyncClient):
    response = await client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert data["posts"] == []
    assert data["total"] == 0
    assert data["skip"] == 0
    assert data["has_more"] is False


@pytest.mark.anyio
async def test_get_posts_returns_correct_fields(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    await create_post(client, token, title="Hello World", content="Body text")

    response = await client.get("/api/posts")
    assert response.status_code == 200
    post = response.json()["posts"][0]
    assert "id" in post
    assert "title" in post
    assert "content" in post
    assert "user_id" in post
    assert "date_posted" in post
    assert "author" in post
    assert "username" in post["author"]
    assert "image_path" in post["author"]
    # password must never appear
    assert "password" not in post["author"]
    assert "password_hash" not in post["author"]


@pytest.mark.anyio
async def test_get_posts_ordered_newest_first(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    for i in range(3):
        await create_post(client, token, title=f"Post {i}")

    data = (await client.get("/api/posts")).json()
    titles = [p["title"] for p in data["posts"]]
    assert titles == ["Post 2", "Post 1", "Post 0"]


@pytest.mark.anyio
async def test_get_posts_pagination_limit(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    for i in range(5):
        await create_post(client, token, title=f"Post {i}")

    data = (await client.get("/api/posts?limit=2")).json()
    assert len(data["posts"]) == 2
    assert data["total"] == 5
    assert data["has_more"] is True
    assert data["limit"] == 2


@pytest.mark.anyio
async def test_get_posts_pagination_skip(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    for i in range(5):
        await create_post(client, token, title=f"Post {i}")

    data = (await client.get("/api/posts?skip=4&limit=10")).json()
    assert len(data["posts"]) == 1
    assert data["skip"] == 4
    assert data["has_more"] is False


@pytest.mark.anyio
async def test_get_posts_skip_beyond_total(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    await create_post(client, token)

    data = (await client.get("/api/posts?skip=999")).json()
    assert data["posts"] == []
    assert data["total"] == 1
    assert data["has_more"] is False


@pytest.mark.anyio
async def test_get_posts_invalid_limit(client: AsyncClient):
    response = await client.get("/api/posts?limit=0")
    assert response.status_code == 422

    response = await client.get("/api/posts?limit=101")
    assert response.status_code == 422


# ── GET /api/posts/{id} ───────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_get_post_success(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    created = await create_post(client, token, title="Single Post", content="Content")

    response = await client.get(f"/api/posts/{created['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created["id"]
    assert data["title"] == "Single Post"
    assert data["content"] == "Content"


@pytest.mark.anyio
async def test_get_post_not_found(client: AsyncClient):
    response = await client.get("/api/posts/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


# ── POST /api/posts ───────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_create_post_success(client: AsyncClient):
    user = await create_test_user(client)
    token = await login_user(client)

    response = await client.post(
        "/api/posts",
        json={"title": "My First Post", "content": "Hello world"},
        headers=auth_header(token),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My First Post"
    assert data["content"] == "Hello world"
    assert data["user_id"] == user["id"]
    assert data["author"]["username"] == "testuser"
    assert "date_posted" in data


@pytest.mark.anyio
async def test_create_post_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/posts",
        json={"title": "No auth", "content": "Should fail"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_post_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/posts",
        json={"title": "Bad token", "content": "Should fail"},
        headers={"Authorization": "Bearer not.a.real.token"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_create_post_missing_title(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.post(
        "/api/posts",
        json={"content": "Missing title"},
        headers=auth_header(token),
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_post_missing_content(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.post(
        "/api/posts",
        json={"title": "Missing content"},
        headers=auth_header(token),
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_post_title_too_long(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.post(
        "/api/posts",
        json={"title": "x" * 101, "content": "Fine"},
        headers=auth_header(token),
    )
    assert response.status_code == 422


# ── PUT /api/posts/{id} ───────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_full_update_post_success(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token, title="Old Title", content="Old content")

    response = await client.put(
        f"/api/posts/{post['id']}",
        json={"title": "New Title", "content": "New content"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["content"] == "New content"


@pytest.mark.anyio
async def test_full_update_post_not_found(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.put(
        "/api/posts/99999",
        json={"title": "X", "content": "Y"},
        headers=auth_header(token),
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_full_update_post_wrong_user(client: AsyncClient):
    await create_test_user(client, username="owner", email="owner@example.com")
    owner_token = await login_user(client, email="owner@example.com")
    post = await create_post(client, owner_token)

    await create_test_user(client, username="other", email="other@example.com")
    other_token = await login_user(client, email="other@example.com")

    response = await client.put(
        f"/api/posts/{post['id']}",
        json={"title": "Stolen", "content": "Nope"},
        headers=auth_header(other_token),
    )
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


# ── PATCH /api/posts/{id} ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_partial_update_title_only(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token, title="Original", content="Keep this")

    response = await client.patch(
        f"/api/posts/{post['id']}",
        json={"title": "Updated Title"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Keep this"  # unchanged


@pytest.mark.anyio
async def test_partial_update_content_only(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token, title="Keep this", content="Old content")

    response = await client.patch(
        f"/api/posts/{post['id']}",
        json={"content": "New content"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Keep this"  # unchanged
    assert data["content"] == "New content"


@pytest.mark.anyio
async def test_partial_update_post_not_found(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.patch(
        "/api/posts/99999",
        json={"title": "Nope"},
        headers=auth_header(token),
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_partial_update_post_wrong_user(client: AsyncClient):
    await create_test_user(client, username="user1", email="user1@example.com")
    token1 = await login_user(client, email="user1@example.com")
    post = await create_post(client, token1)

    await create_test_user(client, username="user2", email="user2@example.com")
    token2 = await login_user(client, email="user2@example.com")

    response = await client.patch(
        f"/api/posts/{post['id']}",
        json={"title": "Hacked"},
        headers=auth_header(token2),
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to update this post"


@pytest.mark.anyio
async def test_partial_update_unauthorized(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token)

    response = await client.patch(f"/api/posts/{post['id']}", json={"title": "X"})
    assert response.status_code == 401


# ── DELETE /api/posts/{id} ────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_delete_post_success(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token)

    response = await client.delete(
        f"/api/posts/{post['id']}",
        headers=auth_header(token),
    )
    assert response.status_code == 204

    # Confirm it's gone
    response = await client.get(f"/api/posts/{post['id']}")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_post_not_found(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)

    response = await client.delete(
        "/api/posts/99999",
        headers=auth_header(token),
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_post_wrong_user(client: AsyncClient):
    await create_test_user(client, username="owner", email="owner@example.com")
    owner_token = await login_user(client, email="owner@example.com")
    post = await create_post(client, owner_token)

    await create_test_user(client, username="other", email="other@example.com")
    other_token = await login_user(client, email="other@example.com")

    response = await client.delete(
        f"/api/posts/{post['id']}",
        headers=auth_header(other_token),
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to delete this post"


@pytest.mark.anyio
async def test_delete_post_unauthorized(client: AsyncClient):
    await create_test_user(client)
    token = await login_user(client)
    post = await create_post(client, token)

    response = await client.delete(f"/api/posts/{post['id']}")
    assert response.status_code == 401
