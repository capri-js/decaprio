import { FC, ReactNode } from "react";

export const DefaultDocument: FC<{ children: ReactNode }> = ({ children }) => (
  <html>
    <head></head>
    <body>{children}</body>
  </html>
);
