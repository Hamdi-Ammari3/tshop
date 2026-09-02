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

/*
  //Fetch Products
  useEffect(() => {

    async function load() {

      try {

        const latest = await getNewProducts();

        setNewProducts(latest);

        const firstPage = await getProductsPage(30);

        setProducts(diversifyProducts(firstPage.products));

        setLastDoc(firstPage.lastDoc);

        setHasMore(firstPage.hasMore);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);

  //Load more products
  async function handleLoadMore() {

    if (!lastDoc) {
      setHasMore(false);
      return;
    }

    const nextPage = await getProductsPage(30,lastDoc);

    setProducts(prev => [
      ...prev,
      ...diversifyProducts(nextPage.products),
    ]);

    setLastDoc(nextPage.lastDoc);

    setHasMore(nextPage.hasMore);
  }

  //Diversify products
  const diversifiedNewProducts = useMemo(() => {
    
    return diversifyProducts(newProducts).slice(0, 10);
    
  }, [newProducts]);

  //Search products
  async function handleSearch() {

    const keyword = search.trim();

    if (!keyword) return;

    try {

      setSearchLoading(true);

      const results = await searchProducts(keyword);

      setSearchResults(results);

      setHasSearched(true);

    } catch(error) {

      console.log(error);

    } finally {

      setSearchLoading(false);

    }
  }

  //Clear Search
  function clearSearch() {

    setSearch("");

    setSearchResults([]);

    setHasSearched(false);

  }
*/

/*
<section className="search-section">

        <div className="search-box">

          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {

              if(e.key === "Enter"){

                handleSearch();

              }

            }}
          />

          <button
            className={`search-btn ${hasSearched ? "clear-btn" : ""}`}
            disabled={!hasSearched && (!search.trim() || searchLoading)}
            onClick={hasSearched ? clearSearch : handleSearch}
          >
            {searchLoading ? "Recherche..." : hasSearched ? "Effacer" : "Rechercher"}
          </button>

        </div>

      </section>

            <section className="categories-section">

        <div className="categories-scroll">

          {categories.map((category) => (
            <button
              key={category.slug}
              className={"category-card"}
              onClick={() => router.push(`/category/${category.slug}`)}
            >

              <div className="category-image">

                <img
                  src={category.image}
                  alt={category.label}
                />

              </div>

              <span>
                {category.label}
              </span>

            </button>
          ))}

        </div>

      </section>

            {hasSearched ? (

  <>
    {searchResults.length > 0 ? (

      <ProductSection
        title={`Résultats pour "${search}"`}
        products={searchResults}
      />

    ) : (

      <div className="empty-search">

        <div className="empty-search-icon">
          🔍
        </div>

        <h3>
          Aucun produit trouvé
        </h3>

        <p>
          Nous n'avons trouvé aucun produit correspondant à
          "{search}".
        </p>

        <button
          onClick={() => {

            setHasSearched(false);

            setSearch("");

            setSearchResults([]);

          }}
          className="empty-search-btn"
        >
          Voir tous les produits
        </button>

      </div>

    )}
  </>

) : (

  <>
    <ProductSection
      title="🆕 Nouveautés"
      products={diversifiedNewProducts}
      horizontal
      featured
    />

    <ProductSection
      title="✨ Pour vous"
      products={products}
      showMore={hasMore}
      onShowMore={handleLoadMore}
    />
  </>

)}
*/