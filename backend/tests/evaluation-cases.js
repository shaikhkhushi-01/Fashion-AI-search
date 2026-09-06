const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "Shirts",
    gender: "Men",
    color: "Black",
    style: "Classic",
    occasion: "Office",
    material: "Cotton",
    price: 2499,
    description: "Black cotton formal shirt for office wear"
  },
  {
    id: 2,
    name: "White Casual Shirt",
    category: "Shirts",
    gender: "Men",
    color: "White",
    style: "Casual",
    occasion: "College",
    material: "Cotton",
    price: 1799,
    description: "White casual cotton shirt"
  },
  {
    id: 3,
    name: "Blue Sneakers",
    category: "Sneakers",
    gender: "Unisex",
    color: "Blue",
    style: "Sporty",
    occasion: "College",
    material: "Polyester",
    price: 2999,
    description: "Comfortable blue sneakers for college"
  },
  {
    id: 4,
    name: "Black Evening Dress",
    category: "Dresses",
    gender: "Women",
    color: "Black",
    style: "Elegant",
    occasion: "Evening",
    material: "Silk",
    price: 4999,
    description: "Elegant black dress for evening events"
  },
  {
    id: 5,
    name: "Blue Denim Jeans",
    category: "Jeans",
    gender: "Unisex",
    color: "Blue",
    style: "Casual",
    occasion: "College",
    material: "Denim",
    price: 2299,
    description: "Blue casual denim jeans"
  },
  {
    id: 6,
    name: "Grey Hoodie",
    category: "Hoodies",
    gender: "Unisex",
    color: "Grey",
    style: "Comfortable",
    occasion: "Travel",
    material: "Cotton",
    price: 1999,
    description: "Comfortable grey cotton hoodie"
  },
  {
    id: 7,
    name: "Black Blazer",
    category: "Blazers",
    gender: "Men",
    color: "Black",
    style: "Classic",
    occasion: "Office",
    material: "Wool",
    price: 5999,
    description: "Classic black blazer for office"
  },
  {
    id: 8,
    name: "Cream Linen Shirt",
    category: "Shirts",
    gender: "Unisex",
    color: "Cream",
    style: "Minimal",
    occasion: "Casual",
    material: "Linen",
    price: 2199,
    description: "Minimal cream linen shirt"
  }
];

const evaluationCases = [
  {
    query: "black formal shirt for office",
    relevant: ["1"],
    relevance: {
      "1": 3,
      "7": 1,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "8": 0
    }
  },
  {
    query: "blue sneakers for college",
    relevant: ["3"],
    relevance: {
      "3": 3,
      "5": 1,
      "2": 0,
      "6": 0,
      "1": 0,
      "4": 0,
      "7": 0,
      "8": 0
    }
  },
  {
    query: "elegant black dress for evening",
    relevant: ["4"],
    relevance: {
      "4": 3,
      "7": 1,
      "1": 0,
      "2": 0,
      "3": 0,
      "5": 0,
      "6": 0,
      "8": 0
    }
  },
  {
    query: "comfortable cotton hoodie for travel",
    relevant: ["6"],
    relevance: {
      "6": 3,
      "2": 1,
      "8": 1,
      "1": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "7": 0
    }
  },
  {
    query: "minimal cream linen shirt",
    relevant: ["8"],
    relevance: {
      "8": 3,
      "1": 1,
      "2": 1,
      "4": 0,
      "3": 0,
      "5": 0,
      "6": 0,
      "7": 0
    }
  }
];

export {
  products,
  evaluationCases
};
