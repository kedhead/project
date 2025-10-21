<script>
  import { Gantt, Willow } from "@svar-ui/svelte-gantt";
  import "@svar-ui/svelte-gantt/dist/gantt.css";

  // Props from React
  export let tasks = [];
  export let links = [];
  export let onTaskAdd = null;
  export let onTaskUpdate = null;
  export let onTaskDelete = null;
  export let onLinkAdd = null;
  export let onLinkDelete = null;

  // API reference
  let api;

  // Initialize API and set up event handlers
  function init(ganttApi) {
    api = ganttApi;

    // Listen to task events
    api.on("add-task", (ev) => {
      console.log("add-task event:", ev);
      if (onTaskAdd) {
        onTaskAdd(ev);
      }
    });

    api.on("update-task", (ev) => {
      console.log("update-task event:", ev);
      if (onTaskUpdate) {
        onTaskUpdate(ev);
      }
    });

    api.on("delete-task", (ev) => {
      console.log("delete-task event:", ev);
      if (onTaskDelete) {
        onTaskDelete(ev);
      }
    });

    // Listen to link events
    api.on("add-link", (ev) => {
      console.log("add-link event:", ev);
      if (onLinkAdd) {
        onLinkAdd(ev);
      }
    });

    api.on("delete-link", (ev) => {
      console.log("delete-link event:", ev);
      if (onLinkDelete) {
        onLinkDelete(ev);
      }
    });
  }

  // Column configuration with inline editors
  const columns = [
    {
      id: "text",
      header: "Task Name",
      width: "300px",
      align: "left",
      flexgrow: 1,
      editor: "text" // Inline text editor
    },
    {
      id: "start",
      header: "Start",
      width: "120px",
      align: "center",
      editor: "datepicker" // Inline date picker
    },
    {
      id: "end",
      header: "End",
      width: "120px",
      align: "center",
      editor: "datepicker" // Inline date picker
    },
    {
      id: "duration",
      header: "Days",
      width: "70px",
      align: "center",
      editor: "text" // Inline text editor
    },
    {
      id: "progress",
      header: "Progress %",
      width: "90px",
      align: "center",
      editor: "text" // Inline text editor
    },
  ];

  // Scales configuration
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" },
  ];
</script>

<Willow>
  <Gantt
    {tasks}
    {links}
    {columns}
    {scales}
    {init}
    readonly={false}
    cellHeight={44}
    cellWidth={60}
    scaleHeight={60}
  />
</Willow>

<style>
  :global(.gantt-container) {
    width: 100%;
    height: 800px;
  }
</style>
