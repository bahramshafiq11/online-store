import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../api";
import AdminNav from "../../components/AdminNav";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "",
  countInStock: "",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          countInStock: p.countInStock,
        });
      })
      .catch(() => setError("Could not load product"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError("Image must be smaller than 5 MB");
      e.target.value = "";
      return;
    }

    const data = new FormData();
    data.append("image", file);

    setError("");
    setUploading(true);
    try {
      const res = await api.post("/upload", data);
      setForm((prev) => ({ ...prev, image: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data = {
      ...form,
      price: Number(form.price),
      countInStock: Number(form.countInStock),
    };

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, data);
      } else {
        await api.post("/products", data);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
      setSaving(false);
    }
  };

  if (loading) return <p className="status">Loading...</p>;

  return (
    <div>
      <AdminNav />
      <h1>{isEdit ? "Edit product" : "Add product"}</h1>

      {error && <p className="form-error">{error}</p>}

      <form className="panel narrow" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Description
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Price (Rs.)
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Stock
              <input
                name="countInStock"
                type="number"
                min="0"
                value={form.countInStock}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Electronics"
              required
            />
          </label>

          <label>
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
          {uploading && <p className="muted">Uploading image...</p>}

          <label>
            Or paste an image URL
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          {form.image && <img className="image-preview" src={form.image} alt="Preview" />}

          <div className="form-actions">
            <button className="btn" disabled={saving || uploading}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add product"}
            </button>
            <Link to="/admin/products" className="btn secondary">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
}