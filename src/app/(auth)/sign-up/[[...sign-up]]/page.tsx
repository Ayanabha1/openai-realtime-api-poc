import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex flex-col text-center">
      <h1 className="font-medium text-xl">New Account Creation Not Allowed</h1>
      <p className="max-w-[80%] mx-auto">
        Currently this website is only available for C3ALabs members. Please
        contact C3ALabs for more information.
      </p>
    </div>
  );
}
