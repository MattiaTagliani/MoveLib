import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registrazione completata</CardTitle>

            <CardDescription>Controlla la tua email</CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Controlla la tua email e segui le istruzioni ricevute per
              completare l&apos;accesso a MoveLib.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
