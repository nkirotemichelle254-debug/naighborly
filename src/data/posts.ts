export type PostIntent = "Offer" | "Request";
export type PostCategory = "Item" | "Service" | "Swap";
export type PostTone = "charcoal" | "blue" | "gold";

export interface Post {
  id: string;
  title: string;
  description: string;
  details: string;
  category: PostCategory;
  intent: PostIntent;
  location: string;
  tone: PostTone;
  owner: string;
  ownerInitials: string;
  time: string;
  allowCalls: boolean;
  phone: string;
  note: string;
  urgent?: boolean;
  resolved?: boolean;
}

export const SEED_POSTS: Post[] = [
  {
    id: "office-chair-available",
    title: "Office chair available",
    description: "Good condition, free pick up",
    details:
      "Comfortable office chair in solid condition. Ideal for a home desk setup, study corner, or shared workspace.",
    category: "Item",
    intent: "Offer",
    location: "Westlands",
    tone: "charcoal",
    owner: "Sarah Kamau",
    ownerInitials: "SK",
    time: "10 mins ago",
    allowCalls: true,
    phone: "+254700100101",
    note: "Meet near a public pickup point and confirm the item condition before taking it home.",
  },
  {
    id: "plumbing-services-offered",
    title: "Plumbing services offered",
    description: "Professional plumber, affordable rates",
    details:
      "I help with kitchen leaks, sink fittings, tap replacements, and quick weekend plumbing fixes around the area.",
    category: "Service",
    intent: "Offer",
    location: "Kilimani",
    tone: "blue",
    owner: "David Otieno",
    ownerInitials: "DO",
    time: "24 mins ago",
    allowCalls: true,
    phone: "+254700200202",
    note: "Share clear photos of the issue before booking to save time for both sides.",
  },
  {
    id: "book-swap-psychology-novels",
    title: "Book swap — Psychology novels",
    description: "Looking to exchange fiction books",
    details:
      "Open to swapping clean psychology, self-development, or fiction titles. Happy to compare reading lists before meeting.",
    category: "Swap",
    intent: "Offer",
    location: "Lavington",
    tone: "gold",
    owner: "Grace Wanjiru",
    ownerInitials: "GW",
    time: "50 mins ago",
    allowCalls: false,
    phone: "+254700300303",
    note: "For swaps, agree on the exact titles and condition before you meet.",
  },
  {
    id: "need-laptop-charger-urgently",
    title: "Need laptop charger urgently",
    description: "HP laptop charger, willing to pay",
    details:
      "My charger failed today and I need a compatible HP charger urgently. I can buy it outright or swap for another useful item.",
    category: "Item",
    intent: "Request",
    location: "Parklands",
    tone: "charcoal",
    urgent: true,
    owner: "Michael Heri",
    ownerInitials: "MH",
    time: "2 hours ago",
    allowCalls: false,
    phone: "+254700400404",
    note: "Urgent requests work best when you include a clear model or compatibility photo.",
  },
  {
    id: "childrens-books-bundle",
    title: "Children's books bundle",
    description: "Great condition, ages 5-10",
    details:
      "A bundle of storybooks in good condition for young readers. Happy to hand them over to a family, school, or reading club.",
    category: "Item",
    intent: "Offer",
    location: "Karen",
    tone: "charcoal",
    owner: "James Mwangi",
    ownerInitials: "JM",
    time: "3 hours ago",
    allowCalls: false,
    phone: "+254700500505",
    note: "Double-check pickup timing with the owner so the handoff stays smooth.",
  },
  {
    id: "garden-maintenance",
    title: "Garden maintenance",
    description: "Weekly garden care and landscaping",
    details:
      "Available for routine garden care, pruning, watering plans, and light landscaping support for busy households.",
    category: "Service",
    intent: "Offer",
    location: "Runda",
    tone: "blue",
    owner: "Joy Njeri",
    ownerInitials: "JN",
    time: "Today",
    allowCalls: true,
    phone: "+254700600606",
    note: "For services, agree on scope, timing, and any materials before the job starts.",
  },
  {
    id: "kitchen-appliances-swap",
    title: "Kitchen appliances swap",
    description: "Blender for food processor",
    details:
      "I have a working blender and would like to exchange it for a compact food processor. Open to discussing condition and top-up.",
    category: "Swap",
    intent: "Offer",
    location: "Westlands",
    tone: "gold",
    owner: "Akinyi Achieng",
    ownerInitials: "AA",
    time: "Today",
    allowCalls: false,
    phone: "+254700700707",
    note: "Test both appliances in person when possible before completing the swap.",
  },
  {
    id: "looking-for-a-tutor",
    title: "Looking for a tutor",
    description: "Math tutor for high school student",
    details:
      "Looking for a reliable tutor for regular math sessions after school. Prefer someone patient, consistent, and nearby.",
    category: "Service",
    intent: "Request",
    location: "Kileleshwa",
    tone: "blue",
    owner: "Brian Kimani",
    ownerInitials: "BK",
    time: "Yesterday",
    allowCalls: false,
    phone: "+254700800808",
    note: "Ask for experience level, availability, and learning goals before confirming tutoring sessions.",
  },
];

export interface AdSlot {
  tag: string;
  title: string;
  body: string;
  cta: string;
}

export const AD_SLOTS: AdSlot[] = [
  {
    tag: "Sponsored",
    title: "Grow your duka with M-PESA Pay Bill",
    body: "Accept payments instantly and keep your neighbours coming back.",
    cta: "Learn more",
  },
  {
    tag: "Sponsored",
    title: "Solar lighting for every home",
    body: "Affordable plans from KSh 800/month. Install in under an hour.",
    cta: "Get a quote",
  },
  {
    tag: "Sponsored",
    title: "Fresh groceries, delivered today",
    body: "Order from local mama mbogas and get same-day delivery.",
    cta: "Shop now",
  },
];
