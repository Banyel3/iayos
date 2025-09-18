import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const account = await prisma.accounts.findUnique({
    where: {
      email: body.email,
    },
    select: {
      accountID: true,
    },
  });

  if (!account) {
    return new Response(JSON.stringify({ error: "Account not found" }), {
      status: 404,
    });
  }

  const profile = await prisma.profile.findFirst({
    where: {
      accountID: account.accountID,
      OR: [{ profileType: null }, { profileType: "" }],
    },
    select: {
      profileID: true,
    },
  });

  if (!profile) {
    return new Response(JSON.stringify({ error: "Account not found" }), {
      status: 404,
    });
  } else {
    console.log(account);
    console.log(profile);
  }

  try {
    await prisma.profile.update({
      where: {
        profileID: profile.profileID,
      },
      data: {
        profileType: body.selectedType,
      },
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    throw new Error("An Error Occured");
  }
}
