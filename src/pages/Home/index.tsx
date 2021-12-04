import { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {

  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    // Assim como no addProduct nós iremos clonar as informações para serem alteradas
    const newSumAmount = {...sumAmount};

    // E aqui nós iremos acessar a propriedade product.id do newSumAmount;
    // Essa sintaxe de acessar propriedades do objeto é a mesma coisa que usar a notação "."

    // Como essa propriedade ainda não existe dentro do OBJ ela será criada e será atribuída 
    // a product.amount;

    // O resultado esperado desse retorno é um objeto com uma chave que é o id do produto e o valor
    // sendo a quantidade desse produto no carrinho;

    // Exemplo: { 1: 3 }; 3 é a quantidade do produto que tem o id 1;
    newSumAmount[product.id] = product.amount;

    return newSumAmount;
  }, {} as CartItemsAmount);

  useEffect(() => {
    async function loadProducts() {
      // MINHA VERSÃO
      // api.get("/products")
      //   .then(response => setProducts(response.data));

      // VERSÃO DO INSTRUTOR

      const response = await api.get<Product[]>("/products");
      const data = response.data.map(product => ({
        ...product,
        priceFormatted: formatPrice(product.price)
      }))

      setProducts(data);
    };

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  };

  return (
    <ProductList>
      {products.map(product => {
        return (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            {/* A diferença é que na minha versão aqui eu iria receber a propriedade product.price já passando a função de formatação: formatPrice(product.price) */}
            <span>{product.priceFormatted}</span> 
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[product.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        )
      })}
    </ProductList>
  );
};

export default Home;
