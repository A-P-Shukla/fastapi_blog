"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  changePassword,
  deleteAccount,
  deleteProfilePicture,
  getErrorMessage,
  updateUser,
  uploadProfilePicture,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Modal from "@/components/Modal";
import Sidebar from "@/components/Sidebar";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [infoErr, setInfoErr] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) { setUsername(user.username); setEmail(user.email); }
  }, [user, loading, router]);

  if (loading || !user) return <div className="flex-1 py-8 text-center text-gray-400 text-sm">Loading…</div>;

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg(""); setInfoErr("");
    setSavingInfo(true);
    try {
      await updateUser(user.id, { username, email });
      await refresh();
      setInfoMsg("Profile updated successfully.");
    } catch (err: unknown) {
      setInfoErr(getErrorMessage(err as never));
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (newPw !== confirmPw) { setPwErr("New passwords do not match."); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setPwMsg("Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: unknown) {
      setPwErr(getErrorMessage(err as never));
    } finally {
      setSavingPw(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadProfilePicture(user.id, file);
      await refresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err as never));
    }
  };

  const handleDeletePicture = async () => {
    try {
      await deleteProfilePicture(user.id);
      await refresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err as never));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(user.id);
      logout();
      router.push("/");
    } catch (err: unknown) {
      alert(getErrorMessage(err as never));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <section className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Profile picture */}
        <div className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-5">
          <h3 className="font-heading font-semibold text-[#444] dark:text-[#f0f0f0] mb-4">Profile Picture</h3>
          <div className="flex items-center gap-5">
            <Image
              src={user.image_path}
              alt="Profile picture"
              width={100}
              height={100}
              className="rounded-full object-cover border border-gray-200 dark:border-[#4a4a4a]"
            />
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
              <button onClick={() => fileRef.current?.click()} className="btn-outline text-sm">
                Upload New Picture
              </button>
              {user.image_file && (
                <button onClick={handleDeletePicture} className="btn-secondary text-sm">
                  Remove Picture
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-5">
          <h3 className="font-heading font-semibold text-[#444] dark:text-[#f0f0f0] mb-4">Account Info</h3>
          <form onSubmit={handleInfoSave} className="flex flex-col gap-4">
            {infoMsg && <p className="text-green-600 text-sm">{infoMsg}</p>}
            {infoErr && <p className="text-red-600 text-sm">{infoErr}</p>}
            <div>
              <label className="form-label" htmlFor="acc-username">Username</label>
              <input id="acc-username" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={50} />
            </div>
            <div>
              <label className="form-label" htmlFor="acc-email">Email</label>
              <input id="acc-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <button type="submit" disabled={savingInfo} className="btn-primary">
                {savingInfo ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-5">
          <h3 className="font-heading font-semibold text-[#444] dark:text-[#f0f0f0] mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            {pwMsg && <p className="text-green-600 text-sm">{pwMsg}</p>}
            {pwErr && <p className="text-red-600 text-sm">{pwErr}</p>}
            <div>
              <label className="form-label" htmlFor="current-pw">Current Password</label>
              <input id="current-pw" type="password" className="form-input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div>
              <label className="form-label" htmlFor="new-pw">New Password</label>
              <input id="new-pw" type="password" className="form-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
              <input id="confirm-pw" type="password" className="form-input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} />
            </div>
            <div>
              <button type="submit" disabled={savingPw} className="btn-primary">
                {savingPw ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-[#2d2d2d] border border-red-200 dark:border-red-900/40 rounded-lg shadow-sm px-6 py-5">
          <h3 className="font-heading font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Deleting your account is permanent and cannot be undone.
          </p>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-sm">
            Delete Account
          </button>
        </div>
      </section>

      <aside className="w-full md:w-72 flex-shrink-0"><Sidebar /></aside>

      {showDeleteConfirm && (
        <Modal
          title="Delete Account?"
          headerClass="bg-[#a85b5b]"
          onClose={() => setShowDeleteConfirm(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDeleteAccount} disabled={deleting} className="btn-danger">
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </>
          }
        >
          <p className="text-gray-700 dark:text-gray-300">
            This will permanently delete your account and all your posts. This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
