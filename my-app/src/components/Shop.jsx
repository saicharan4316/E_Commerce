import { Box, Grid, TextField, Select, MenuItem, InputLabel, FormControl, Typography } from "@mui/material";
import { useEffect, useState,useMemo } from "react";
import ProductList from "./ProductList";
import { useCart } from "./CartContext";
import axios from "axios";
import { toast } from "react-toastify";
const API_URL_3000 = import.meta.env.VITE_API_URL_3000 || 'https://e-commerce-server-xezh.onrender.com ';

export default function Shop() {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const { addToCart } = useCart();

  const categories = useMemo(
  () => [...new Set((filteredProducts || []).map((p) => p.category))],
  [filteredProducts]
);
const limit = 10;
  const offset = (page - 1) * limit;
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const min = minPrice ? minPrice : 0;
        const max = maxPrice ? maxPrice : "";

        let url = `${API_URL_3000}/filter/products?minPrice=${min}&maxPrice=${max}&limit=${limit}&offset=${offset}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFilteredProducts(response.data);
      } catch (err) {
        toast.error("Too Many Requests. Try Again After Some Time");
      }
    };

    fetchFilteredProducts();
  }, [minPrice, maxPrice, category, page]);

  if (!filteredProducts) {
    return <Typography sx={{ p: 3 }}>Loading products...</Typography>;
  }

  return (
    <><Box sx={{
  px: { xs: 1, md: 4 },
  py: 2,
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  mb: 2
}}>
  <Grid container>
    <Grid size={12}>
      <Typography variant="h5" sx={{ mb: 2 }}>Want to filter?</Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: { xs: "flex-start", md: "flex-start" }
        }}
      >
        <TextField
          label="Min Price"
          variant="outlined"
          size="small"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Max Price"
          variant="outlined"
          size="small"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <FormControl size="small" variant="outlined" sx={{ minWidth: 180 }}>
          <InputLabel id="category-label">Filter by Category</InputLabel>
          <Select
            labelId="category-label"
            id="category-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            label="Filter by Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((cat, i) => (
              <MenuItem key={i} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Grid>
  </Grid>
</Box>

      <ProductList
        products={filteredProducts}
        addToCart={addToCart}
        page={page}
        setPage={setPage}
      />
    </>
  );
}
