const products = [
  {
    id: 1,
    name: "Relaxed Linen Shirt",
    category: "Shirts",
    gender: "Unisex",
    color: "White",
    material: ["Linen"],
    style: ["Relaxed", "Minimal", "Casual"],
    occasion: ["Summer", "Casual", "Travel", "Everyday"],
    price: 2499
  },
  {
    id: 2,
    name: "Oversized Cotton Shirt",
    category: "Shirts",
    gender: "Unisex",
    color: "Black",
    material: ["Cotton"],
    style: ["Oversized", "Minimal", "Streetwear", "Casual"],
    occasion: ["College", "Casual", "Everyday", "Travel"],
    price: 1999
  },
  {
    id: 3,
    name: "Minimal Summer Dress",
    category: "Dresses",
    gender: "Women",
    color: "Cream",
    material: ["Cotton"],
    style: ["Minimal", "Elegant", "Relaxed"],
    occasion: ["Summer", "Casual", "Date", "Travel"],
    price: 3299
  },
  {
    id: 4,
    name: "Relaxed Black Trousers",
    category: "Trousers",
    gender: "Unisex",
    color: "Black",
    material: ["Cotton Blend"],
    style: ["Relaxed", "Minimal", "Classic"],
    occasion: ["College", "Office", "Casual", "Everyday"],
    price: 2799
  },
  {
    id: 5,
    name: "Performance Sneakers",
    category: "Sneakers",
    gender: "Unisex",
    color: "White",
    material: ["Mesh"],
    style: ["Sporty", "Minimal", "Modern"],
    occasion: ["Everyday", "Travel", "College", "Casual"],
    price: 4499
  },
  {
    id: 6,
    name: "Structured Black Blazer",
    category: "Blazers",
    gender: "Unisex",
    color: "Black",
    material: ["Wool Blend"],
    style: ["Formal", "Minimal", "Classic", "Elegant"],
    occasion: ["Office", "Formal", "Evening", "Wedding"],
    price: 5999
  },
  {
    id: 7,
    name: "Classic Blue Denim Jeans",
    category: "Jeans",
    gender: "Unisex",
    color: "Blue",
    material: ["Denim"],
    style: ["Classic", "Casual", "Relaxed"],
    occasion: ["College", "Casual", "Everyday", "Travel"],
    price: 2299
  },
  {
    id: 8,
    name: "Elegant Satin Evening Dress",
    category: "Dresses",
    gender: "Women",
    color: "Black",
    material: ["Satin"],
    style: ["Elegant", "Luxury", "Modern"],
    occasion: ["Evening", "Party", "Date", "Wedding"],
    price: 4999
  },
  {
    id: 9,
    name: "Minimal Cotton Hoodie",
    category: "Hoodies",
    gender: "Unisex",
    color: "Grey",
    material: ["Cotton"],
    style: ["Oversized", "Minimal", "Streetwear", "Comfortable"],
    occasion: ["College", "Casual", "Travel", "Everyday"],
    price: 1899
  },
  {
    id: 10,
    name: "White Minimal Sneakers",
    category: "Sneakers",
    gender: "Unisex",
    color: "White",
    material: ["Leather"],
    style: ["Minimal", "Classic", "Modern"],
    occasion: ["College", "Casual", "Everyday", "Travel"],
    price: 3999
  }
];

const evaluationCases = [
  {
    query: "relaxed linen shirt for summer",
    relevant: ["1"],
    relevance: { "1": 3, "2": 1, "3": 1 }
  },
  {
    query: "black oversized cotton shirt for college",
    relevant: ["2"],
    relevance: { "2": 3, "1": 1, "9": 1 }
  },
  {
    query: "minimal cream summer dress",
    relevant: ["3"],
    relevance: { "3": 3, "8": 1 }
  },
  {
    query: "black trousers for office",
    relevant: ["4"],
    relevance: { "4": 3, "6": 2 }
  },
  {
    query: "comfortable sneakers for travel",
    relevant: ["5", "10"],
    relevance: { "5": 3, "10": 2, "7": 1 }
  },
  {
    query: "formal black blazer for office",
    relevant: ["6"],
    relevance: { "6": 3, "4": 1 }
  },
  {
    query: "blue denim jeans for college",
    relevant: ["7"],
    relevance: { "7": 3, "2": 1 }
  },
  {
    query: "elegant black dress for evening",
    relevant: ["8"],
    relevance: { "8": 3, "6": 1 }
  },
  {
    query: "comfortable cotton hoodie for travel",
    relevant: ["9"],
    relevance: { "9": 3, "2": 1, "1": 1 }
  },
  {
    query: "white minimal sneakers",
    relevant: ["10"],
    relevance: { "10": 3, "5": 2 }
  },
  {
    query: "breathable shirt for hot weather",
    relevant: ["1"],
    relevance: { "1": 3, "2": 1, "3": 2 }
  },
  {
    query: "everyday black casual shirt",
    relevant: ["2"],
    relevance: { "2": 3, "4": 2 }
  },
  {
    query: "lightweight dress for a summer date",
    relevant: ["3"],
    relevance: { "3": 3, "8": 2 }
  },
  {
    query: "relaxed black pants for everyday wear",
    relevant: ["4"],
    relevance: { "4": 3, "7": 1 }
  },
  {
    query: "white sporty shoes for college",
    relevant: ["5"],
    relevance: { "5": 3, "10": 2 }
  },
  {
    query: "classic elegant black jacket for wedding",
    relevant: ["6"],
    relevance: { "6": 3, "8": 1 }
  },
  {
    query: "casual blue denim for travel",
    relevant: ["7"],
    relevance: { "7": 3, "4": 1 }
  },
  {
    query: "luxury black party dress",
    relevant: ["8"],
    relevance: { "8": 3, "6": 1 }
  },
  {
    query: "soft oversized hoodie for college",
    relevant: ["9"],
    relevance: { "9": 3, "2": 2 }
  },
  {
    query: "clean white shoes for everyday outfits",
    relevant: ["10"],
    relevance: { "10": 3, "5": 2 }
  },
  {
    query: "minimal linen top for travel",
    relevant: ["1"],
    relevance: { "1": 3, "2": 1 }
  },
  {
    query: "streetwear black shirt",
    relevant: ["2"],
    relevance: { "2": 3, "9": 2 }
  },
  {
    query: "cream cotton dress for warm weather",
    relevant: ["3"],
    relevance: { "3": 3, "1": 1 }
  },
  {
    query: "smart casual black trousers",
    relevant: ["4"],
    relevance: { "4": 3, "6": 1 }
  },
  {
    query: "lightweight breathable sneakers",
    relevant: ["5"],
    relevance: { "5": 3, "10": 1 }
  },
  {
    query: "professional black blazer",
    relevant: ["6"],
    relevance: { "6": 3, "4": 1 }
  },
  {
    query: "relaxed fit blue jeans",
    relevant: ["7"],
    relevance: { "7": 3, "4": 1 }
  },
  {
    query: "satin dress for a party",
    relevant: ["8"],
    relevance: { "8": 3, "6": 1 }
  },
  {
    query: "grey oversized cotton hoodie",
    relevant: ["9"],
    relevance: { "9": 3, "2": 1 }
  },
  {
    query: "modern white sneakers",
    relevant: ["10"],
    relevance: { "10": 3, "5": 2 }
  },
  {
    query: "shirt under 2500 for summer",
    relevant: ["1", "2"],
    relevance: { "1": 3, "2": 2 }
  },
  {
    query: "casual black outfit for college",
    relevant: ["2", "4", "9"],
    relevance: { "2": 3, "4": 2, "9": 2 }
  },
  {
    query: "elegant outfit for evening",
    relevant: ["8", "6"],
    relevance: { "8": 3, "6": 2 }
  },
  {
    query: "comfortable outfit for travel",
    relevant: ["1", "5", "7", "9", "10"],
    relevance: { "1": 3, "9": 3, "5": 2, "7": 2, "10": 2 }
  },
  {
    query: "minimal everyday fashion",
    relevant: ["1", "2", "4", "9", "10"],
    relevance: { "1": 3, "2": 3, "10": 2, "4": 2, "9": 2 }
  },
  {
    query: "black formal wear",
    relevant: ["6", "4"],
    relevance: { "6": 3, "4": 2, "8": 1 }
  },
  {
    query: "white casual footwear",
    relevant: ["10", "5"],
    relevance: { "10": 3, "5": 2 }
  },
  {
    query: "cotton clothing for college",
    relevant: ["2", "9"],
    relevance: { "2": 3, "9": 3, "3": 1 }
  },
  {
    query: "date night dress",
    relevant: ["8", "3"],
    relevance: { "8": 3, "3": 2 }
  },
  {
    query: "classic casual denim outfit",
    relevant: ["7"],
    relevance: { "7": 3, "4": 1, "2": 1 }
  },
  {
    query: "minimal black fashion for office",
    relevant: ["4", "6"],
    relevance: { "6": 3, "4": 2 }
  }
];

export {
  products,
  evaluationCases
};
