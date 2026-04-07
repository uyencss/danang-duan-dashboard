import { z } from "zod";
try {
  const schema = z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional().nullable()
  );
  console.log("Empty string:", schema.parse(""));
  console.log("Undefined:", schema.parse(undefined));
} catch (e: any) {
  console.log("Error:", JSON.stringify(e.errors, null, 2));
}
