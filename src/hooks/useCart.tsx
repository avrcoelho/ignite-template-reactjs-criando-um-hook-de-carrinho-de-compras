import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockData } = await api.get<Stock>(`stock/${productId}`);
      const findProduct = cart.find((item) => item.id === productId);
      let productsSerialized: Product[] = [];

      if (
        stockData.amount < 1 ||
        (findProduct && findProduct.amount + 1 > stockData.amount)
      ) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      if (findProduct) {
        productsSerialized = cart.map((prev) =>
          prev.id === productId ? { ...prev, amount: prev.amount + 1 } : prev
        );
      } else {
        const { data: productData } = await api.get<Product>(
          `products/${productId}`
        );
        productsSerialized = [...cart, { ...productData, amount: 1 }];
      }

      setCart(productsSerialized);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(productsSerialized)
      );
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find((item) => item.id === productId);
      if (!findProduct) {
        throw new Error();
      }

      const productsSerialized = cart.filter((prev) => prev.id !== productId);
      setCart(productsSerialized);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(productsSerialized)
      );
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }

      const { data: stockData } = await api.get<Stock>(`stock/${productId}`);
      if (stockData.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productsSerialized = cart.map((prev) =>
        prev.id === productId ? { ...prev, amount: amount } : prev
      );
      setCart(productsSerialized);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(productsSerialized)
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
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
