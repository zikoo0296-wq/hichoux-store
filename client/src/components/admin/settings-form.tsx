import { useState, useEffect, useRef } from "react";
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
import { Loader2, Save, FileSpreadsheet, Truck, RefreshCw, MessageCircle, Store, CheckCircle, Upload, X, Image } from "lucide-react";
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
  store?: string; // DIGYLOG specific
  network?: string; // DIGYLOG specific
}

export function SettingsForm() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    google_sheets_id: "",
    whatsapp_number: "",
    delivery_cost: "35",
    free_delivery_threshold: "300",
    store_name: "",
    store_phone: "",
    default_carrier: "digylog" as CarrierId,
    store_logo: "",
    store_icon: "",
  });

  const [carriers, setCarriers] = useState<Record<CarrierId, CarrierConfig>>({
    digylog: { enabled: false, apiKey: "", apiUrl: "https://api.digylog.com/api/v2/seller", accountId: "", store: "", network: "1" },
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
        store_logo: settingsMap.get("store_logo") || "",
        store_icon: settingsMap.get("store_icon") || "",
      });

      const newCarriers = { ...carriers };
      CARRIERS.forEach((carrier) => {
        const enabled = settingsMap.get(`carrier_${carrier.id}_enabled`) === "true";
        const apiKey = settingsMap.get(`carrier_${carrier.id}_api_key`) || "";
        const apiUrl = settingsMap.get(`carrier_${carrier.id}_api_url`) || carriers[carrier.id].apiUrl;
        const accountId = settingsMap.get(`carrier_${carrier.id}_account_id`) || "";
        newCarriers[carrier.id] = { enabled, apiKey, apiUrl, accountId };
        
        // DIGYLOG specific fields
        if (carrier.id === "digylog") {
          newCarriers[carrier.id].store = settingsMap.get(`carrier_digylog_store`) || "";
          newCarriers[carrier.id].network = settingsMap.get(`carrier_digylog_network`) || "1";
        }
      });
      setCarriers(newCarriers);
    }
  }, [settings]);

  const handleImageUpload = async (file: File, type: 'logo' | 'icon') => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === 'logo') {
        setFormData({ ...formData, store_logo: base64 });
      } else {
        setFormData({ ...formData, store_icon: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

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
        
        // DIGYLOG specific fields
        if (carrier.id === "digylog" && config.store) {
          settingsToSave[`carrier_digylog_store`] = config.store;
        }
        if (carrier.id === "digylog" && config.network) {
          settingsToSave[`carrier_digylog_network`] = config.network;
        }
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
      let errorMessage = "Impossible de sauvegarder les paramètres.";
      if (error.message) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || errorMessage;
          } else if (error.message.includes("<!DOCTYPE") || error.message.includes("<html")) {
            errorMessage = "Erreur de serveur. Veuillez réessayer.";
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Erreur",
        description: errorMessage,
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
      let errorMessage = "Impossible de synchroniser avec Google Sheets.";
      if (error.message) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || errorMessage;
          } else if (error.message.includes("<!DOCTYPE") || error.message.includes("<html")) {
            errorMessage = "Erreur de connexion à Google Sheets. Vérifiez la configuration.";
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle>Logo et icône</CardTitle>
              </div>
              <CardDescription>
                Téléchargez le logo et l'icône de votre boutique (max 2 Mo)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>Logo de la boutique</Label>
                  <div className="flex items-center gap-4">
                    {formData.store_logo ? (
                      <div className="relative">
                        <img
                          src={formData.store_logo}
                          alt="Logo"
                          className="w-20 h-20 rounded-xl object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setFormData({ ...formData, store_logo: "" })}
                          data-testid="button-remove-logo"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover-elevate"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo');
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="gap-2"
                        data-testid="button-upload-logo"
                      >
                        <Upload className="h-4 w-4" />
                        {formData.store_logo ? "Changer" : "Télécharger"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG ou WebP recommandé
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Icône / Favicon</Label>
                  <div className="flex items-center gap-4">
                    {formData.store_icon ? (
                      <div className="relative">
                        <img
                          src={formData.store_icon}
                          alt="Icône"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setFormData({ ...formData, store_icon: "" })}
                          data-testid="button-remove-icon"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover-elevate"
                        onClick={() => iconInputRef.current?.click()}
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'icon');
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => iconInputRef.current?.click()}
                        className="gap-2"
                        data-testid="button-upload-icon"
                      >
                        <Upload className="h-4 w-4" />
                        {formData.store_icon ? "Changer" : "Télécharger"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format carré recommandé (32x32 ou 64x64)
                      </p>
                    </div>
                  </div>
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
                        placeholder={carrier.id === "digylog" ? "https://api.digylog.com/api/v2/seller" : `https://api.${carrier.id}.ma/v1`}
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
                    <Label>Clé API (Token)</Label>
                    <Input
                      type="password"
                      value={carriers[carrier.id].apiKey}
                      onChange={(e) => updateCarrier(carrier.id, "apiKey", e.target.value)}
                      placeholder={carrier.id === "digylog" ? "Votre token DIGYLOG" : "sk_live_..."}
                      data-testid={`input-carrier-${carrier.id}-key`}
                    />
                  </div>
                  
                  {carrier.id === "digylog" && (
                    <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                      <div className="space-y-2">
                        <Label>Nom du Store DIGYLOG *</Label>
                        <Input
                          value={carriers.digylog.store || ""}
                          onChange={(e) => updateCarrier("digylog", "store", e.target.value)}
                          placeholder="Nom de votre store (obligatoire)"
                          data-testid="input-carrier-digylog-store"
                        />
                        <p className="text-xs text-muted-foreground">
                          Le nom de votre store tel que configuré dans DIGYLOG
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>ID Network DIGYLOG *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={carriers.digylog.network || "1"}
                          onChange={(e) => updateCarrier("digylog", "network", e.target.value)}
                          placeholder="1"
                          data-testid="input-carrier-digylog-network"
                        />
                        <p className="text-xs text-muted-foreground">
                          ID du réseau (ex: 1 pour Agadir, 2 pour Casablanca)
                        </p>
                      </div>
                    </div>
                  )}
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
