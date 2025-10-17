import type { Route } from "./+types/home";
import { HomePage } from "../components/home/HomePage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GMS • Home" },
    { name: "description", content: "GMS Web App – A clean, standard homepage structure built with React Router and Tailwind CSS." },
  ];
}

export default function Home() {
  return <HomePage />;
}
