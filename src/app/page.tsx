import { RecipeSwiper } from '@/components/RecipeSwiper';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="z-10 w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">Recipe Swiper</h1>
        <RecipeSwiper />
      </div>
    </main>
  );
}