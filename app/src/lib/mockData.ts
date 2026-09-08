export interface DisplayItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "LOST" | "FOUND";
  status: "ACTIVE" | "RESOLVED" | "CANCELLED";
  location: string;
  imageUrl: string;
  imageAlt: string;
  createdAtText: string;
  reward?: string;
  isVerified?: boolean;
  isUrgent?: boolean;
  custodyInfo?: string;
  reporter: {
    name: string;
    initials: string;
    roleTag?: string;
    avatarColor?: string;
  };
}

// Clean initial items list (no unwanted mock/dummy listings)
export const INITIAL_MOCK_ITEMS: DisplayItem[] = [];
