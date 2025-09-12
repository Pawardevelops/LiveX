import VehicleDetails from "@/app/components/VehicleDetails";

export default function VehicleDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <VehicleDetails bikeId={params.id} />
    </>
  );
}
