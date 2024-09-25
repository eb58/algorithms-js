class IndexCard {
  private topic: string;
  private text: string;
  private tags: string[];
  private creationDate: number;
  private modificationDate: number;

  constructor(question: string, answer: string, tags: string[] = []) {
    this.topic = question;
    this.text = answer;
    this.tags = tags;
    this.creationDate = this.modificationDate = Date.now();
  }

  getTags = (): string[] => this.tags;
  getTopic = (): string => this.topic;
  getText = (): string => this.text;

  addTags = (tags: string[]): string[] => (this.tags = Array.from(new Set([...this.tags, ...tags])));
  addTag = (tag: string) => this.addTags([tag]);
  removeTag = (tag: string): string[] => (this.tags = this.tags.filter((t) => t !== tag));
  matches = (s: string): boolean => this.text.includes(s) || this.topic.includes(s) || this.tags.some((t) => t.includes(s));
}
