import CompoundInterestCalculator from '@/components/compound-interest-calculator';

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-start p-4 py-10 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Compound Interest Sage
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Calcule o crescimento do seu investimento e veja o poder dos juros compostos.
          </p>
        </header>
        <CompoundInterestCalculator />
      </div>
    </main>
  );
}
