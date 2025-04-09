export function RadarControls() {
  return (
    <div className=" bg-black text-white font-mono flex">
      <div>
        <button className="block w-[64px] h-[32px] border border-white cursor-pointer text-sm">
          DFW N
        </button>
        <button className="block w-[64px] h-[32px] border border-white cursor-pointer text-sm bg-white text-black">
          DFW S
        </button>
      </div>
      <div>
        <a
          href="https://s1-fmt2.liveatc.net/kdfw1_app_feeder_west1"
          target="_blank"
          rel="noreferrer noopener"
        >
          <button className="block w-[80px] h-[64px] border border-white cursor-pointer text-sm">
            APP W 119.875
          </button>
        </a>
      </div>
      <div>
        <a
          href="https://s1-fmt2.liveatc.net/kdfw1_dep_w"
          target="_blank"
          rel="noreferrer noopener"
        >
          <button className="block w-[80px] h-[64px] border border-white cursor-pointer text-sm">
            DEP W 126.475
          </button>
        </a>
      </div>
      <div>
        <a
          href="https://s1-fmt2.liveatc.net/kdfw1_app_fin_18r"
          target="_blank"
          rel="noreferrer noopener"
        >
          <button className="block w-[80px] h-[64px] border border-white cursor-pointer text-sm">
            APP 18R 118.425
          </button>
        </a>
      </div>
    </div>
  );
}
