import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, FileSpreadsheet, Truck, RefreshCw } from "lucide-react";
import type { Setting } from "@shared/schema";

export function SettingsForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    google_sheets_id: "",
    carrier_api_key: "",
    carrier_api_url: "",
    whatsapp_number: "",
    delivery_cost: "",
  });

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      const settingsMap = new Map(settings.map((s) => [s.key, s.value || ""]));
      setFormData({
        google_sheets_id: settingsMap.get("google_sheets_id") || "",
        carrier_api_key: settingsMap.get("carrier_api_key") || "",
        carrier_api_url: settingsMap.get("carrier_api_url") || "",
        whatsapp_number: settingsMap.get("whatsapp_number") || "",
        delivery_cost: settingsMap.get("delivery_cost") || "0",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres ont été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  const syncSheetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/google-sheets/sync");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation réussie",
        description: `${data.synced || 0} commande(s) synchronisée(s) avec Google Sheets.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser avec Google Sheets.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <CardTitle>Google Sheets</CardTitle>
          </div>
          <CardDescription>
            Configurez l'intégration avec Google Sheets pour synchroniser automatiquement les commandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_sheets_id">ID du Spreadsheet</Label>
            <Input
              id="google_sheets_id"
              value={formData.google_sheets_id}
              onChange={(e) => setFormData({ ...formData, google_sheets_id: e.target.value })}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              data-testid="input-sheets-id"
            />
            <p className="text-xs text-muted-foreground">
              L'ID se trouve dans l'URL du spreadsheet: https://docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => syncSheetsMutation.mutate()}
              disabled={syncSheetsMutation.isPending || !formData.google_sheets_id}
              className="gap-2"
              data-testid="button-sync-sheets"
            >
              {syncSheetsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Synchroniser maintenant
            </Button>
            <span className="text-sm text-muted-foreground">
              Synchronise toutes les commandes confirmées non synchronisées
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <CardTitle>API Transporteur</CardTitle>
          </div>
          <CardDescription>
            Configurez les credentials de l'API de votre société de livraison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carrier_api_url">URL de l'API</Label>
            <Input
              id="carrier_api_url"
              value={formData.carrier_api_url}
              onChange={(e) => setFormData({ ...formData, carrier_api_url: e.target.value })}
              placeholder="https://api.carrier.com/v1"
              data-testid="input-carrier-url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier_api_key">Clé API</Label>
            <Input
              id="carrier_api_key"
              type="password"
              value={formData.carrier_api_key}
              onChange={(e) => setFormData({ ...formData, carrier_api_key: e.target.value })}
              placeholder="sk_live_..."
              data-testid="input-carrier-key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_cost">Coût de livraison par défaut (DH)</Label>
            <Input
              id="delivery_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_cost}
              onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
              placeholder="30.00"
              data-testid="input-delivery-cost"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>
            Numéro WhatsApp pour les notifications et commandes rapides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">Numéro WhatsApp</Label>
            <Input
              id="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              placeholder="212600000000"
              data-testid="input-whatsapp"
            />
            <p className="text-xs text-muted-foreground">
              Format international sans le + (ex: 212600000000)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="gap-2"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer les paramètres
        </Button>
      </div>
    </form>
  );
}
