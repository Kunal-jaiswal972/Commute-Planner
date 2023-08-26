import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React from "react";

const commutesPerYear = 260 * 2;
const litresPerKM = 10 / 100;
const gasLitreCost = 1.5;
const litreCostKM = litresPerKM * gasLitreCost;
const secondsPerDay = 60 * 60 * 24;

export default function DetailsCard({ pathInfo }) {
  if (!pathInfo.distance || !pathInfo.duration) return null;

  const days = Math.floor(
    (commutesPerYear * pathInfo.duration) / secondsPerDay
  );
  const cost = Math.floor(
    (pathInfo.distance / 1000) * litreCostKM * commutesPerYear
  );

  const secondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes} min`;
    return `${hours} hr ${minutes} min`;
  };

  const [is, setis] = React.useState(true);

  return (
    <Accordion
      sx={{
        position: "absolute",
        bottom: 0,
        zIndex: 1000,
        left: "50%",
        transform: "translate(-50%)",
        width: "40%",
      }}
      expanded={is}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon onClick={() => setis(!is)} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography>{}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>
          This house is {pathInfo.distance / 1000} km away from your office. That
          would take {secondsToHMS(pathInfo.duration)} each day.
        </Typography>

        <Typography>
          That's {days} days in your car each year at a cost of $
          {new Intl.NumberFormat().format(cost)}.
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
