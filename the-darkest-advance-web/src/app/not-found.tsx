import { NextIntlClientProvider } from "next-intl";
import NotFoundClient from "@/components/not-found/NotFoundClient";

import messages from "./messages/es.json";

export default function NotFound() {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      <NotFoundClient />
    </NextIntlClientProvider>
  );
}