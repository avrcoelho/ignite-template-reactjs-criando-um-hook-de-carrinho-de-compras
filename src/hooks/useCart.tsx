import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const isMount = useRef(true);

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data: stockData } = await api.get<Stock>(`stock/${productId}`);
      const findProduct = cart.find((item) => item.id === productId);

      if (
        stockData.amount < 1 ||
        (findProduct && findProduct.amount + 1 < stockData.amount)
      ) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      if (findProduct) {
        setCart((prevState) =>
          prevState.map((prev) =>
            prev.id === productId ? { ...prev, amount: prev.amount + 1 } : prev
          )
        );
      } else {
        const { data: productData } = await api.get<Product>(
          `products/${productId}`
        );

        setCart((prevState) => [...prevState, { ...productData, amount: 1 }]);
      }
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

      setCart((prevState) => prevState.filter((prev) => prev.id !== productId));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
