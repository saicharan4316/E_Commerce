import { useNavigate } from "react-router-dom";
import "../styles/product.css";
import { useCart } from "./CartContext";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleCardClick = () => {
    navigate(`/product/${product.product_id}`);
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <img src={product.image_url} alt={product.name} loading="lazy" />
      <div className="card-body">
        <h5>{product.name}</h5>
        <p>₹{product.price}</p>
        <button className="add-btn" onClick={handleAddToCartClick}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
