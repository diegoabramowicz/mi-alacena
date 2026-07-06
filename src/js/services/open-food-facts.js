export async function fetchOFF(code) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const nombre = product.product_name_es || product.product_name || "";
    const img = product.image_front_url || product.image_front_small_url || "";
    const tags = (product.categories_tags || []).join(" ").toLowerCase();

    let cat = "";
    if (tags.includes("bebida") || tags.includes("beverage") || tags.includes("drink")) cat = "Bebidas";
    else if (tags.includes("dairy") || tags.includes("lacteo") || tags.includes("leche")) cat = "Lácteos";
    else if (tags.includes("cereal") || tags.includes("pasta") || tags.includes("arroz")) cat = "Cereales";
    else if (tags.includes("snack") || tags.includes("chip") || tags.includes("galleta")) cat = "Snacks";
    else if (tags.includes("sauce") || tags.includes("condiment") || tags.includes("aceite")) cat = "Condimentos";
    else if (tags.includes("canned") || tags.includes("conserva")) cat = "Enlatados";

    return { nombre: nombre.trim(), img, cat };
  } catch {
    return null;
  }
}
