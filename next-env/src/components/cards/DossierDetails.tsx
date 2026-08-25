import Detail from "@/components/nav/Detail";
import type { ProducerDossier } from "@/lib/producerRegistration";

/** The identity block of a producer dossier, shown to the admin and to the producer. */
const DossierDetails = ({ dossier }: { dossier: ProducerDossier }) => (
	<>
		<Detail label="SIRET" value={dossier.siret} />
		<Detail label="Code APE" value={dossier.apeCode} />
		<Detail label="Représentant légal" value={dossier.representativeName} />
		<Detail label="Email" value={dossier.email} />
		<Detail label="Téléphone" value={dossier.phone} />
		<Detail
			label="Siège social"
			value={`${dossier.street}, ${dossier.postalCode} ${dossier.city}, ${dossier.country}`}
		/>
		<div className="sm:col-span-2">
			<Detail label="Wallet" value={dossier.account} />
		</div>
	</>
);

export default DossierDetails;
