import ProductCard from "./ProductCard";
import "../styles/product.css";

export default function ProductList({ products, page, setPage }) {
  return (
    <div>
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.product_id} product={p} />
        ))}
      </div>

     
      <div
        className="pagination"
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <button
          className="page-btn"
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span style={{ fontWeight: "bold" }}>You're on Page {page} !</span>
        <button
          className="page-btn"
          onClick={() => setPage(page + 1)}
          disabled={products.length < 10}
        >
          Next
        </button>
      </div>
    </div>
  );
}
