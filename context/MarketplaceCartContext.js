"use client";

import {createContext,useContext,useEffect,useMemo,useState} from "react";

const MarketplaceCartContext = createContext();

export function MarketplaceCartProvider({children}) {

    const [cart,setCart] = useState([]);

    useEffect(() => {

        const saved = localStorage.getItem("marketplace-cart");

        if(saved){

            setCart(JSON.parse(saved));

        }

    }, []);

    useEffect(() => {

        localStorage.setItem("marketplace-cart",JSON.stringify(cart));

    }, [cart]);

    //Add to cart
    function addToCart(product,quantity = 1) {

        setCart(prev => {

            const existing = prev.find(item => item.cartItemId === product.cartItemId);

            if(existing){

                return prev.map(item => item.cartItemId === product.cartItemId ? {
                    ...item,
                    quantity: item.quantity + quantity,
                } : item
                );

            }

            return [...prev, {...product,quantity}];

        });

    }

    //Remove from cart
    function removeFromCart(cartItemId) {

        setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));

    }

    //Update cart quantity
    function updateCartQuantity(cartItemId,quantity) {

        if(quantity <= 0) {

            removeFromCart(cartItemId);

            return;

        }

        setCart(prev => prev.map(item => item.cartItemId === cartItemId ? {...item,quantity} : item));

    }

    //Clear Cart
    function clearCart() {

        setCart([]);

    }

    //Cart count
    const cartCount = useMemo(() => {

      return cart.reduce((sum,item) => sum + item.quantity,0);

    }, [cart]);

    //Cart subtotal
    const cartSubtotal = useMemo(() => {

        return cart.reduce((sum,item) => {

            if(item.selectedLot) {

                return (sum + Number(item.finalPrice));

            }

            return (sum + Number(item.finalPrice) * item.quantity);

        }, 0);

    }, [cart]);

    // SHIPPING FEES BY STORE
    const shippingFee = useMemo(() => {

        if (!cart.length) return 0;

        const uniqueStores = new Map();

        cart.forEach(item => {

            if (!uniqueStores.has(item.storeId)) {

                uniqueStores.set(
                    item.storeId,
                    Number(item.shipping_fee || 8)
                );

            }

        });

        return [...uniqueStores.values()].reduce((sum, fee) => sum + fee, 0);

    }, [cart]);

    // FINAL TOTAL
    const cartTotal = useMemo(() => {

        return cartSubtotal + shippingFee;

    }, [cartSubtotal, shippingFee]);

    return (

        <MarketplaceCartContext.Provider
            value={{
                cart,
                cartCount,
                cartSubtotal,
                shippingFee,  
                cartTotal,
                addToCart,
                removeFromCart,
                updateCartQuantity,
                clearCart,
            }}
        >

            {children}

        </MarketplaceCartContext.Provider>

    );

}

export function useMarketplaceCart(){

    return useContext(MarketplaceCartContext);

}