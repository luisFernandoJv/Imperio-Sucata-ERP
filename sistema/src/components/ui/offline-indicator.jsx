import { useEffect, useRef, useState } from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [reconnected, setReconnected] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    const handleOnline = () => {
      clearTimeout(timerRef.current);
      setOnline(true);
      setReconnected(true);
      timerRef.current = setTimeout(() => setReconnected(false), 5000);
    };
    const handleOffline = () => {
      clearTimeout(timerRef.current);
      setOnline(false);
      setReconnected(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  if (online && !reconnected) return null;
  return (
    <div
      className={`global-notice ${online ? "connection-online" : "connection-offline"}`}
      role="status"
    >
      {online ? (
        <CheckCircle2 size={21} aria-hidden="true" />
      ) : (
        <WifiOff size={21} aria-hidden="true" />
      )}
      <div>
        <strong>{online ? "Conexão restaurada" : "Sem conexão"}</strong>
        <p>
          {online
            ? "Confira a atualização dos dados e a confirmação dos registros antes de continuar."
            : "Alguns dados podem estar desatualizados. Aguarde a confirmação dos registros; este aviso não garante sincronização de alterações."}
        </p>
      </div>
    </div>
  );
}
