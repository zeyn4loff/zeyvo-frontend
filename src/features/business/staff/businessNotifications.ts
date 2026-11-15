export type BusinessNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  kind: "booking" | "review" | "schedule";
  read: boolean;
};

