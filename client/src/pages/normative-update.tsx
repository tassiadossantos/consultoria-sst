import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NormativeUpdate() {
  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nota Técnica</h2>
          <p className="text-muted-foreground">Atualização Normativa</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Nova portaria do MTE sobre eSocial S-2240</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nova portaria do MTE sobre eSocial S-2240 foi publicada. O sistema já está atualizado.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
