import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, tokenStore } from "../../lib/api";

type Address = {
  _id?: string;
  city?: string;
  district?: string;
  is_default?: boolean;
  label?: string;
  phone?: string;
  recipient_name?: string;
  street?: string;
};

type User = {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: string;
  addresses?: Address[];
  role?: string[];
  status?: string;
};

const Profile: React.FC = () => {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    dob: "",
    avatar: "",
  });

  const [addr, setAddr] = useState<Address>({
    label: "Home",
    recipient_name: "",
    phone: "",
    street: "",
    district: "",
    city: "",
    is_default: true,
  });

  const defaultAddress = useMemo(() => {
    if (!me?.addresses?.length) return null;
    return me.addresses.find((a) => a.is_default) || me.addresses[0];
  }, [me]);

  const loadMe = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await api<User>("/users/me");
      setMe(data);

      setForm({
        name: data.name || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: data.dob ? data.dob.slice(0, 10) : "",
        avatar: data.avatar || "",
      });

      const a =
        (data.addresses?.find((x) => x.is_default) || data.addresses?.[0]) ?? {};
      setAddr({
        label: a.label || "Home",
        recipient_name: a.recipient_name || data.name || "",
        phone: a.phone || data.phone || "",
        street: a.street || "",
        district: a.district || "",
        city: a.city || "",
        is_default: a.is_default ?? true,
      });
    } catch (e: any) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const onLogout = () => {
    tokenStore.clear();
    // HashRouter => redirect phải có /#/
    window.location.href = "/#/login";
  };

  const onSave = async () => {
    setErr("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        avatar: form.avatar,
        addresses: [addr],
      };

      const updated = await api<User>("/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setMe(updated);
      setEditing(false);
      alert("Saved ✅");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (err) {
    return (
      <div className="p-6">
        <div className="text-red-500 font-bold mb-2">{err}</div>
        <button
          onClick={loadMe}
          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!me) return <div className="p-6">No user</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="bg-primary p-1.5 rounded-lg flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-2xl">
              dashboard
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Account
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm"
          >
            Return to Shop
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">logout</span>{" "}
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6">
          <nav className="flex flex-col gap-1 px-3">
            <Link
              to="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium"
            >
              <span className="material-symbols-outlined">person</span> Profile
            </Link>
            <Link
              to="/account/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined">shopping_bag</span>{" "}
              Orders
            </Link>
            <Link
              to="/account/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined">settings</span>{" "}
              Settings
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <section className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20">
                <img
                  src={
                    form.avatar ||
                    me.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80"
                  }
                  className="h-full w-full object-cover"
                  alt="avatar"
                />
              </div>

              <div className="text-center md:text-left flex-1">
                {!editing ? (
                  <>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {me.name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                      {me.email}
                    </p>
                  </>
                ) : (
                  <div className="grid gap-3 max-w-xl">
                    <input
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Name"
                    />
                    <input
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="Phone"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                      >
                        <option value="">-- gender --</option>
                        <option value="male">male</option>
                        <option value="female">female</option>
                        <option value="other">other</option>
                      </select>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={form.dob}
                        onChange={(e) =>
                          setForm({ ...form, dob: e.target.value })
                        }
                      />
                    </div>

                    <input
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={form.avatar}
                      onChange={(e) =>
                        setForm({ ...form, avatar: e.target.value })
                      }
                      placeholder="Avatar URL (optional)"
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-sm"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-6 py-2 rounded-xl font-bold text-sm"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          loadMe();
                        }}
                        className="px-6 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-primary">
                      local_shipping
                    </span>
                    Delivery Addresses
                  </h3>

                  {!editing ? (
                    <div className="flex items-start gap-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-xl relative">
                      <span className="material-symbols-outlined text-primary mt-1">
                        home
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {defaultAddress?.label || "Home"}
                          </span>
                          <span className="bg-primary text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                            Default
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {[
                            defaultAddress?.street,
                            defaultAddress?.district,
                            defaultAddress?.city,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No address"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                          value={addr.label || ""}
                          onChange={(e) =>
                            setAddr({ ...addr, label: e.target.value })
                          }
                          placeholder="Label (Home, Office...)"
                        />
                        <input
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                          value={addr.recipient_name || ""}
                          onChange={(e) =>
                            setAddr({ ...addr, recipient_name: e.target.value })
                          }
                          placeholder="Recipient name"
                        />
                      </div>

                      <input
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={addr.phone || ""}
                        onChange={(e) =>
                          setAddr({ ...addr, phone: e.target.value })
                        }
                        placeholder="Address phone"
                      />

                      <input
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                        value={addr.street || ""}
                        onChange={(e) =>
                          setAddr({ ...addr, street: e.target.value })
                        }
                        placeholder="Street"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                          value={addr.district || ""}
                          onChange={(e) =>
                            setAddr({ ...addr, district: e.target.value })
                          }
                          placeholder="District"
                        />
                        <input
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white"
                          value={addr.city || ""}
                          onChange={(e) =>
                            setAddr({ ...addr, city: e.target.value })
                          }
                          placeholder="City"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-primary to-orange-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-3xl">
                      loyalty
                    </span>
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase">
                      {(me.role || []).includes("customer") ? "Customer" : "Member"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/70 text-sm">Account</p>
                    <p className="text-xl font-bold">{me.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Tip: nếu bị 401 thì check localStorage access_token.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
