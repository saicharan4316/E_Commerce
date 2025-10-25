import { useNavigate} from "react-router-dom";
import "../styles/hero.css";
export default function Hero() {
  let navigate=useNavigate()
let shopnow =()=>{
navigate('/shop')
 }
  return (
    <section className="hero">
      <h1>Welcome to E-Commerce</h1>
      <p>Find the best deals on your favorite products</p>
      <button className="btn-primary" onClick={shopnow}>Shop Now</button>
    </section>
  );
}
