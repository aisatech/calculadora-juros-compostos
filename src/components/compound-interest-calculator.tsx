
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { CircleDollarSign, Percent, CalendarDays, Repeat, CalculatorIcon, TrendingUp, BarChartBig, PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  principal: z.coerce
    .number({ invalid_type_error: "Valor inválido." })
    .min(0.01, "O valor principal deve ser positivo."),
  monthlyContribution: z.coerce
    .number({ invalid_type_error: "Valor inválido para aporte mensal." })
    .min(0, "O aporte mensal não pode ser negativo."),
  annualRate: z.coerce
    .number({ invalid_type_error: "Valor inválido." })
    .min(0, "A taxa de juros não pode ser negativa."),
  years: z.coerce
    .number({ invalid_type_error: "Valor inválido." })
    .int("Os anos devem ser um número inteiro.")
    .min(1, "O período deve ser de pelo menos 1 ano."),
  compoundingFrequency: z.coerce
    .number({ invalid_type_error: "Valor inválido." })
    .min(1, "A frequência de capitalização deve ser selecionada."),
});

type FormValues = z.infer<typeof formSchema>;

interface MonthlyGrowthRecord {
  monthGlobal: number;
  year: number;
  monthInYear: number;
  startingBalance: number;
  interestEarned: number;
  contribution: number;
  endingBalance: number;
}

const compoundingOptions = [
  { label: "Anual", value: 1 },
  { label: "Semestral", value: 2 },
  { label: "Trimestral", value: 4 },
  { label: "Mensal", value: 12 },
  { label: "Diário", value: 365 },
];

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function CompoundInterestCalculator() {
  const [futureValue, setFutureValue] = React.useState<number | null>(null);
  const [totalInterestEarnedDisplay, setTotalInterestEarnedDisplay] = React.useState<number | null>(null);
  const [totalContributionsDisplay, setTotalContributionsDisplay] = React.useState<number | null>(null); // Renamed from sumOfAllMonthlyContributions
  const [totalPrincipalInvestedDisplay, setTotalPrincipalInvestedDisplay] = React.useState<number | null>(null);
  const [growthTableData, setGrowthTableData] = React.useState<MonthlyGrowthRecord[]>([]);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      monthlyContribution: 100,
      annualRate: 5,
      years: 10,
      compoundingFrequency: 12,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setIsCalculating(true);
    
    const { principal: initialPrincipal, monthlyContribution, annualRate, years, compoundingFrequency } = data;
    const rateDecimal = annualRate / 100;
    const pmt = monthlyContribution || 0; 
    const totalMonths = years * 12;

    // Calculate total future value (using compoundingFrequency for precision)
    let calculatedFutureValue = initialPrincipal;
    const ratePerCompoundingPeriod = rateDecimal / compoundingFrequency;
    const totalCompoundingPeriods = years * compoundingFrequency;

    calculatedFutureValue = initialPrincipal * Math.pow(1 + ratePerCompoundingPeriod, totalCompoundingPeriods);

    if (pmt > 0) {
      let fvContributionsSeries = 0;
      for (let k = 0; k < totalMonths; k++) { 
        const timeInYearsForThisPmt = (totalMonths - (k + 1)) / 12.0;
        const numCompPeriodsForThisPmt = timeInYearsForThisPmt * compoundingFrequency;
        fvContributionsSeries += pmt * Math.pow(1 + ratePerCompoundingPeriod, numCompPeriodsForThisPmt);
      }
      calculatedFutureValue += fvContributionsSeries;
    }
    
    const sumOfAllMonthlyContributionsOnly = pmt * totalMonths;
    const _totalPrincipalInvested = initialPrincipal + sumOfAllMonthlyContributionsOnly;
    const _totalInterestEarned = calculatedFutureValue - _totalPrincipalInvested;

    setFutureValue(calculatedFutureValue);
    setTotalInterestEarnedDisplay(_totalInterestEarned);
    setTotalContributionsDisplay(sumOfAllMonthlyContributionsOnly); // Only monthly contributions
    setTotalPrincipalInvestedDisplay(_totalPrincipalInvested); // Principal + all monthly contributions

    // Calculate monthly growth table (using simple monthly rate for demonstration)
    const monthlyTable: MonthlyGrowthRecord[] = [];
    let currentBalanceForTable = initialPrincipal;
    const monthlyRateForTableDisplay = rateDecimal / 12; 

    for (let m = 1; m <= totalMonths; m++) {
      const yearNum = Math.floor((m - 1) / 12) + 1;
      const monthInYearNum = ((m - 1) % 12) + 1;

      const interestThisMonth = currentBalanceForTable * monthlyRateForTableDisplay;
      const contributionThisMonth = pmt;
      const endingBalanceThisMonth = currentBalanceForTable + interestThisMonth + contributionThisMonth;

      monthlyTable.push({
        monthGlobal: m,
        year: yearNum,
        monthInYear: monthInYearNum,
        startingBalance: currentBalanceForTable,
        interestEarned: interestThisMonth,
        contribution: contributionThisMonth,
        endingBalance: endingBalanceThisMonth,
      });
      currentBalanceForTable = endingBalanceThisMonth;
    }
    setGrowthTableData(monthlyTable);
    
    setTimeout(() => setIsCalculating(false), 200); 
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-card">
          <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
            <CalculatorIcon className="h-6 w-6" />
            Calculadora de Juros Compostos
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Insira os detalhes do seu investimento para ver a projeção de crescimento.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <CircleDollarSign className="h-5 w-5 text-primary" />
                      Valor Principal (R$)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 1000" {...field} className="focus:ring-primary focus:border-primary"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <PiggyBank className="h-5 w-5 text-primary" />
                      Aporte Mensal (R$)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 100" {...field} className="focus:ring-primary focus:border-primary"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <Percent className="h-5 w-5 text-primary" />
                      Taxa de Juros Anual (%)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 5" {...field} className="focus:ring-primary focus:border-primary"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Período (Anos)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="Ex: 10" {...field} className="focus:ring-primary focus:border-primary"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="compoundingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <Repeat className="h-5 w-5 text-primary" />
                      Frequência de Capitalização
                    </FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {compoundingOptions.map(option => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-6 bg-muted/50">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isCalculating}>
                <CalculatorIcon className="mr-2 h-5 w-5" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {futureValue !== null && totalPrincipalInvestedDisplay !== null && totalInterestEarnedDisplay !== null && (
        <Card className="shadow-lg rounded-lg overflow-hidden mt-8">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
              <TrendingUp className="h-6 w-6" />
              Resultados do Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Valor Futuro Estimado</p>
                <p className="text-3xl font-semibold text-primary">{formatCurrency(futureValue)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total Investido</p> {/* Principal + Aportes Mensais */}
                <p className="text-3xl font-semibold text-foreground">{formatCurrency(totalPrincipalInvestedDisplay)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total de Juros Ganhos</p>
                <p className="text-3xl font-semibold text-accent-foreground">{formatCurrency(totalInterestEarnedDisplay)}</p>
              </div>
            </div>
            
            {growthTableData.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold font-headline text-primary">
                  <BarChartBig className="h-5 w-5" />
                  Evolução Detalhada Mensal
                </h3>
                <div className={cn("overflow-x-auto rounded-md border shadow-sm max-h-[500px] overflow-y-auto", {"opacity-60 transition-opacity duration-200": isCalculating})}>
                  <Table>
                    <TableCaption>Projeção detalhada do crescimento do seu investimento mês a mês.</TableCaption>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="text-left font-semibold text-foreground">Mês (Global)</TableHead>
                        <TableHead className="text-left font-semibold text-foreground">Ano</TableHead>
                        <TableHead className="text-left font-semibold text-foreground">Mês (Ano)</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Saldo Inicial</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Aporte</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Juros Ganhos</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Saldo Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {growthTableData.map((row) => (
                        <TableRow key={row.monthGlobal} className="hover:bg-accent/20 transition-colors duration-150">
                          <TableCell className="text-left font-medium">{row.monthGlobal}</TableCell>
                          <TableCell className="text-left">{row.year}</TableCell>
                          <TableCell className="text-left">{row.monthInYear}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.startingBalance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.contribution)}</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">{formatCurrency(row.interestEarned)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{formatCurrency(row.endingBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
