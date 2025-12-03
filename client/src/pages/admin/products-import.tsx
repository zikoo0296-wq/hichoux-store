import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ProductsImportPage() {
  const [csvContent, setCsvContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      return apiRequest("POST", "/api/admin/products/import/csv", { csvContent: csv });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Importation réussie",
        description: `${data.imported} produit(s) importé(s), ${data.skipped} ignoré(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setCsvContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'importation",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importer des produits</h1>
        <p className="text-muted-foreground mt-1">
          Importez plusieurs produits via CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Format CSV requis</CardTitle>
          <CardDescription>
            Les colonnes doivent être: titre, description, prix, coût, stock, sku, categorieid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`titre,description,prix,coût,stock,sku,categorieid
T-shirt,Confortable,99.00,40.00,50,TSH-001,1
Chaussures,Élégantes,299.00,120.00,30,CHO-001,2`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coller votre CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Collez le contenu CSV ici..."
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            data-testid="textarea-csv-content"
          />
          <Button 
            onClick={() => importMutation.mutate(csvContent)}
            disabled={!csvContent || importMutation.isPending}
            className="gap-2"
            data-testid="button-import-csv"
          >
            <Upload className="h-4 w-4" />
            {importMutation.isPending ? "Importation..." : "Importer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
