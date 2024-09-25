class IndexCards {
  private indexCards: IndexCard[] = [];

  addCard = (card: IndexCard): number => this.indexCards.push(card);
  getAllIndexCards = (): IndexCard[] => this.indexCards;
  findIndexCards = (s: string): IndexCard[] => this.indexCards.filter((c) => c.matches(s));
}

// const card = new IndexCard('What is the capital of France?', 'Paris', ['geography', 'capitals']);
// card.addTag('europe');
// console.log(card.getTags()); // Output: ["geography", "capitals", "europe"]

// card.removeTag('capitals');
// console.log(card.getTags()); // Output: ["geography", "europe"]

// console.log(card.getTopic()); // Output: "What is the capital of France?"
// console.log(card.getText()); // Output: "Paris"
