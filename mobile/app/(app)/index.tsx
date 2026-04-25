import { Redirect } from "expo-router";

/**
 * Redirige /(app) → /(app)/(tabs)/ para que el Stack de (app)
 * muestre siempre el grupo de tabs como pantalla inicial.
 */
export default function AppIndex() {
  return <Redirect href="/(app)/(tabs)/" />;
}
