import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, FileSpreadsheet, Truck, RefreshCw, MessageCircle, Store, CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Setting } from "@shared/schema";

const CARRIERS = [
  { id: "digylog", name: "DIGYLOG", color: "bg-blue-500" },
  { id: "ozon", name: "Ozon", color: "bg-green-500" },
  { id: "cathedis", name: "CATHEDIS", color: "bg-orange-500" },
  { id: "sendit", name: "SENDIT", color: "bg-purple-500" },
] as const;

type CarrierId = typeof CARRIERS[number]["id"];

interface CarrierConfig {
  enabled: boolean;
  apiKey: string;
  apiUrl: string;
  accountId: string;
}

export function SettingsForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    google_sheets_id: "",
    whatsapp_number: "",
    delivery_cost: "35",
    free_delivery_threshold: "300",
    store_name: "",
    store_phone: "",
    default_carrier: "digylog" as CarrierId,
  });

  const [carriers, setCarriers] = useState<Record<CarrierId, CarrierConfig>>({
    digylog: { enabled: false, apiKey: "", apiUrl: "https://api.digylog.ma/v1", accountId: "" },
    ozon: { enabled: false, apiKey: "", apiUrl: "https://api.ozon.ma/v1", accountId: "" },
    cathedis: { enabled: false, apiKey: "", apiUrl: "https://api.cathedis.ma/v1", accountId: "" },
    sendit: { enabled: false, apiKey: "", apiUrl: "https://api.sendit.ma/v1", accountId: "" },
  });

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      const settingsMap = new Map(settings.map((s) => [s.key, s.value || ""]));
      setFormData({
        google_sheets_id: settingsMap.get("google_sheets_id") || "",
        whatsapp_number: settingsMap.get("whatsapp_number") || "",
        delivery_cost: settingsMap.get("delivery_cost") || "35",
        free_delivery_threshold: settingsMap.get("free_delivery_threshold") || "300",
        store_name: settingsMap.get("store_name") || "",
        store_phone: settingsMap.get("store_phone") || "",
        default_carrier: (settingsMap.get("default_carrier") || "digylog") as CarrierId,
      });

      const newCarriers = { ...carriers };
      CARRIERS.forEach((carrier) => {
        const enabled = settingsMap.get(`carrier_${carrier.id}_enabled`) === "true";
        const apiKey = settingsMap.get(`carrier_${carrier.id}_api_key`) || "";
        const apiUrl = settingsMap.get(`carrier_${carrier.id}_api_url`) || carriers[carrier.id].apiUrl;
        const accountId = settingsMap.get(`carrier_${carrier.id}_account_id`) || "";
        newCarriers[carrier.id] = { enabled, apiKey, apiUrl, accountId };
      });
      setCarriers(newCarriers);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { general: typeof formData; carriers: typeof carriers }) => {
      const settingsToSave: Record<string, string> = {
        ...data.general,
        delivery_cost: data.general.delivery_cost,
        free_delivery_threshold: data.general.free_delivery_threshold,
      };

      CARRIERS.forEach((carrier) => {
        const config = data.carriers[carrier.id];
        settingsToSave[`carrier_${carrier.id}_enabled`] = config.enabled ? "true" : "false";
        settingsToSave[`carrier_${carrier.id}_api_key`] = config.apiKey;
        settingsToSave[`carrier_${carrier.id}_api_url`] = config.apiUrl;
        settingsToSave[`carrier_${carrier.id}_account_id`] = config.accountId;
      });

      const response = await apiRequest("POST", "/api/admin/settings", settingsToSave);
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
    saveMutation.mutate({ general: formData, carriers });
  };

  const updateCarrier = (carrierId: CarrierId, field: keyof CarrierConfig, value: string | boolean) => {
    setCarriers((prev) => ({
      ...prev,
      [carrierId]: {
        ...prev[carrierId],
        [field]: value,
      },
    }));
  };

  const enabledCarriersCount = CARRIERS.filter((c) => carriers[c.id].enabled).length;

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
      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            Boutique
          </TabsTrigger>
          <TabsTrigger value="carriers" className="gap-2">
            <Truck className="h-4 w-4" />
            Transporteurs
            {enabledCarriersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {enabledCarriersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sheets" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Google Sheets
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <CardTitle>Informations de la boutique</CardTitle>
              </div>
              <CardDescription>
                Configurez les informations générales de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nom de la boutique</Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="Mon E-Shop"
                    data-testid="input-store-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_phone">Téléphone</Label>
                  <Input
                    id="store_phone"
                    value={formData.store_phone}
                    onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                    placeholder="+212 6 00 00 00 00"
                    data-testid="input-store-phone"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery_cost">Coût de livraison (DH)</Label>
                  <Input
                    id="delivery_cost"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.delivery_cost}
                    onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
                    placeholder="35"
                    data-testid="input-delivery-cost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free_delivery_threshold">Seuil livraison gratuite (DH)</Label>
                  <Input
                    id="free_delivery_threshold"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.free_delivery_threshold}
                    onChange={(e) => setFormData({ ...formData, free_delivery_threshold: e.target.value })}
                    placeholder="300"
                    data-testid="input-free-threshold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Livraison gratuite au-dessus de ce montant
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <CardTitle>Transporteurs</CardTitle>
              </div>
              <CardDescription>
                Configurez les API des sociétés de livraison marocaines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_carrier">Transporteur par défaut</Label>
                <Select
                  value={formData.default_carrier}
                  onValueChange={(value: CarrierId) => setFormData({ ...formData, default_carrier: value })}
                >
                  <SelectTrigger data-testid="select-default-carrier">
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${carrier.color}`} />
                          {carrier.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {CARRIERS.map((carrier) => (
            <Card key={carrier.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${carrier.color}`} />
                    <CardTitle className="text-lg">{carrier.name}</CardTitle>
                    {carriers[carrier.id].enabled && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Activé
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={carriers[carrier.id].enabled}
                    onCheckedChange={(checked) => updateCarrier(carrier.id, "enabled", checked)}
                    data-testid={`switch-carrier-${carrier.id}`}
                  />
                </div>
                <CardDescription>
                  {carrier.id === "digylog" && "Service de livraison rapide au Maroc"}
                  {carrier.id === "ozon" && "Livraison express dans tout le Maroc"}
                  {carrier.id === "cathedis" && "Solutions logistiques pour e-commerce"}
                  {carrier.id === "sendit" && "Plateforme de livraison multi-transporteurs"}
                </CardDescription>
              </CardHeader>
              {carriers[carrier.id].enabled && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>URL de l'API</Label>
                      <Input
                        value={carriers[carrier.id].apiUrl}
                        onChange={(e) => updateCarrier(carrier.id, "apiUrl", e.target.value)}
                        placeholder={`https://api.${carrier.id}.ma/v1`}
                        data-testid={`input-carrier-${carrier.id}-url`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Compte / Client</Label>
                      <Input
                        value={carriers[carrier.id].accountId}
                        onChange={(e) => updateCarrier(carrier.id, "accountId", e.target.value)}
                        placeholder="ACC-123456"
                        data-testid={`input-carrier-${carrier.id}-account`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Clé API</Label>
                    <Input
                      type="password"
                      value={carriers[carrier.id].apiKey}
                      onChange={(e) => updateCarrier(carrier.id, "apiKey", e.target.value)}
                      placeholder="sk_live_..."
                      data-testid={`input-carrier-${carrier.id}-key`}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sheets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <CardTitle>Google Sheets</CardTitle>
              </div>
              <CardDescription>
                Synchronisez automatiquement les commandes avec Google Sheets
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
                  Synchronise toutes les commandes confirmées
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SiWhatsapp className="h-5 w-5 text-green-500" />
                <CardTitle>WhatsApp</CardTitle>
              </div>
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
        </TabsContent>
      </Tabs>

      <div className="flex justify-end sticky bottom-4">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="gap-2 shadow-lg"
          size="lg"
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
