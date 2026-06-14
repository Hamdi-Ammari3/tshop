export function diversifyProducts(products) {

    if (!products?.length) return [];

    const groups = {};

    products.forEach(product => {

        const category = product.category || "Autres";

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(product);

    });

    const categories = Object.keys(groups);

    const diversified = [];

    let hasProducts = true;

    while (hasProducts) {

        hasProducts = false;

        categories.forEach(category => {

            if (groups[category].length > 0) {

                diversified.push(
                    groups[category].shift()
                );

                hasProducts = true;

            }

        });

    }

    return diversified;
}