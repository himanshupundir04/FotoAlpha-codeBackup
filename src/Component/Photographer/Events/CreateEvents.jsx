import React, { useContext } from "react";
import { PhotographerEventContext } from "../Context/PhotographerEventContext";
import CreateEventForm from "../../Common/CreateEventForm";

function CreateEvents() {
  const { setCategoryname } = useContext(PhotographerEventContext);

  return (
    <CreateEventForm
      setCategoryname={setCategoryname}
      upgradePath="/photographer/upgrade_plan"
      successPath={null}
      showSubscriptionGuard={false}
    />
  );
}

export default CreateEvents;
