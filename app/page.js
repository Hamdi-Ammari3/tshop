"use client";

import HeroSlider from './components/HeroSlider';
import SellerCTA from './components/SellerCTA'; 
import CategoryBlocks from './components/CategoryBlocks';
import { categories } from "../data/categories";

export default function Home() {

  return (
    <main className="marketplace">

      <HeroSlider/>

      <CategoryBlocks categories={categories} />

      <SellerCTA/>

    </main>
  );
}