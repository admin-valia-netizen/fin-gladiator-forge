import { MapPin } from "lucide-react";

export const FinTablesMapCard = () => {
  return (
    <div className="w-full card-industrial rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Mesas de Forja FIN</h3>
      </div>

      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d250269.46598127087!2d-69.98659034999999!3d18.45654255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sMesas%20de%20FIN%20Frente%20de%20Integridad%20Nacional!5e0!3m2!1ses-419!2sdo!4v1706900000000!5m2!1ses-419!2sdo"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Mesas FIN"
        />
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Encuentra la Mesa de FIN más cercana a ti para firmar
      </p>
    </div>
  );
};
