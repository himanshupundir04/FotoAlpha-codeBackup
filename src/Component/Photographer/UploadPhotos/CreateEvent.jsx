import React, { useContext } from "react";
import { PhotographerEventContext } from "../Context/PhotographerEventContext";
import CreateEventForm from "../../Common/CreateEventForm";

function CreateEvent() {
  const { setCategoryname } = useContext(PhotographerEventContext);

  return (
    <CreateEventForm
      setCategoryname={setCategoryname}
      upgradePath="/photographer/upgrade_plan"
      successPath="/photographer/events_list"
      showSubscriptionGuard={true}
    />
  );
}

export default CreateEvent;
