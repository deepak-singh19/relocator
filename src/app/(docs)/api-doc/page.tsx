import { getApiDocs } from "@/lib/swagger"
import ReactSwagger from "./ReactSwagger"

export default async function IndexPage() {
  let spec = null;
  try {
    spec = await getApiDocs();
  } catch (error) {
    console.error("Failed to load API documentation:", error);
  }

  return (
    <div className="mb-96 pt-6">
      <section className="container">
        {spec ? (
          <ReactSwagger spec={spec} url="/swagger.json" />
        ) : (
          <p>Failed to load API documentation.</p>
        )}
      </section>
    </div>
  );
}
