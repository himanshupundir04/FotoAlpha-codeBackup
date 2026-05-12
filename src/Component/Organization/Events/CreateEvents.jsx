import React, { useContext } from "react";
import { OrganizationEventContext } from "../Context/OrganizationEventContext";
import CreateEventForm from "../../Common/CreateEventForm";

function CreateEvents() {
  const { setCategoryname } = useContext(OrganizationEventContext);

  return (
    <CreateEventForm
      setCategoryname={setCategoryname}
      upgradePath="/organization/upgrade_plan"
      successPath={null}
      showSubscriptionGuard={false}
    />
  );
}

export default CreateEvents;
