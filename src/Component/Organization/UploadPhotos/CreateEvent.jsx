import React, { useContext } from "react";
import { OrganizationEventContext } from "../Context/OrganizationEventContext";
import CreateEventForm from "../../Common/CreateEventForm";

function CreateEvent() {
  const { setCategoryname } = useContext(OrganizationEventContext);

  return (
    <CreateEventForm
      setCategoryname={setCategoryname}
      upgradePath="/organization/upgrade_plan"
      successPath="/organization/events_list"
      showSubscriptionGuard={false}
    />
  );
}

export default CreateEvent;
