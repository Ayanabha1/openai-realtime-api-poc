import { NextApiRequest, NextApiResponse } from "next";

export const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ status: "ok" });
};
