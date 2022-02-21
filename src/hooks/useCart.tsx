import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    };

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // Clona todas as informações do carrinho para serem manipuladas;
      const updatedCart = [...cart]; 

      // Verifica se o produto passado já foi selecionado;
      const productExist = updatedCart.find(product => product.id === productId); 

      // Pega o valor de estoque do produto selecionado;
      const stock = await api.get(`/stock/${productId}`); 
      const stockAmount = stock.data.amount;

      // Verifica a quantidade atual do produto adicionado no carrinho
      // Caso seja a primeira vez ele é 0;
      const currentAmount = productExist ? productExist.amount : 0;

      // Aqui irá aumentar em 1 o produto no carrinho até chegar no limite do estoque;
      const amount = currentAmount + 1;

      if(amount > stockAmount) { // Verifica se o valor atual do carrinho ultrapassa o valor que existe do produto no estoque;
        toast.error('Quantidade solicitada fora de estoque');
        return;
      };

      /* 
        Se o produto selecionado existir, adicione na quantidade esse mesmo produto:
        productExist.amount = amount;

        Se não existir pegue esse produto da API cria uma nova informação com o valor atual 
        do estoque e adicione no array de manipulação do carrinho (updatedCart);
      */
      if(productExist) {
        productExist.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        };

        // Adiciona na última posição do array updatedCart;
        updatedCart.push(newProduct);
      };

      // Atualiza o valor do carrinho e adicione esse valor no localStorage;

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Não foi possível adicionar um tênis');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];

      // Faz uma pesquisa no array de carrinho pelo index do produto. Caso não encontre o retorno da função é -1;
      const productIndex = updatedCart.findIndex(product => product.id === productId); 

      // Pelo motivo do retorno de não encontrar ser -1 que a gente faz uma condição verificando se o retorno
      // É maior ou igual a 0;
      if(productIndex >= 0) {
        // .splice() irá excluir uma informação do array;
        // Primeiro parâmetro: O que irá ser removido;
        // Segundo parâmetro: Quantos irá ser removido;
        updatedCart.splice(productIndex, 1);

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      };

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      };

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(amount > stockAmount) {
        toast.error('Erro na alteração de quantidade do produto.');
        return;
      };

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists) {
        productExists.amount = amount;
      
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      };

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    };
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
